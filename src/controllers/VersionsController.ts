import { Request, Response } from "express";
import { CustomRequest } from "../middleware/authMiddleware";
import FormData from "form-data";
import axios from "axios";
import fs from "fs";
import prisma from "../utils/db";
import {
  convertAndResizeImage,
  convertImageToBase64,
} from "../middleware/imageProcess";

class VersionController {
  // Create a new version for a specific plant
  createVersion = async (req: CustomRequest, res: Response): Promise<void> => {
    const { plantId } = req.params; // The ID of the plant to add a version to
    const { updated_health_status } = req.body;
    const file = req.file;
    const userId = req.user?.userId;

    // Validate file upload
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      // Ensure the plant exists and belongs to the user
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(plantId) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      // Resize the image
      const resizedImageBuffer = await convertAndResizeImage(file.path);

      // Optionally, send to Flask API for further analysis if needed
      const formData = new FormData();
      formData.append("file", resizedImageBuffer, file.originalname);

      const flaskResponse = await axios.post(
        `${process.env.FLASK_API_URL}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      const { health_status: health_status } = flaskResponse.data;

      // Save version data to the database
      const newVersion = await prisma.version.create({
        data: {
          plantId: parseInt(plantId),
          userId,
          updated_health_status: updated_health_status || health_status,
          updated_image: resizedImageBuffer,
        },
      });

      res.status(201).json(newVersion);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to create version", details: error.message });
    } finally {
      fs.unlinkSync(file.path); // Clean up file
    }
  };

  // Get all versions for a specific plant
  getAllVersions = async (req: CustomRequest, res: Response): Promise<void> => {
    const { plantId } = req.params;
    const userId = req.user?.userId;

    try {
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(plantId) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      const versions = await prisma.version.findMany({
        where: { plantId: parseInt(plantId) },
        orderBy: { date_created: "desc" },
      });

      const versionsWithBase64Images = versions.map((version) => ({
        ...version,
        updated_image: version.updated_image
          ? convertImageToBase64(Buffer.from(version.updated_image))
          : null,
      }));

      res.json(versionsWithBase64Images);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch versions", details: error.message });
    }
  };

  // Get a specific version by ID
  getVersionById = async (req: CustomRequest, res: Response): Promise<void> => {
    const { plantId, versionId } = req.params;
    const userId = req.user?.userId;

    try {
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(plantId) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      const version = await prisma.version.findUnique({
        where: { id_version: parseInt(versionId) },
      });

      if (!version || version.plantId !== parseInt(plantId)) {
        res
          .status(404)
          .json({ error: "Version not found or not related to this plant" });
        return;
      }

      const base64Image = version.updated_image
        ? convertImageToBase64(Buffer.from(version.updated_image))
        : null;

      res.json({
        ...version,
        updated_image: base64Image,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch version", details: error.message });
    }
  };

  // Update a specific version
  updateVersion = async (req: CustomRequest, res: Response): Promise<void> => {
    const { plantId, versionId } = req.params;
    const { updated_health_status } = req.body;
    const file = req.file;
    const userId = req.user?.userId;

    try {
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(plantId) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      let updatedData: any = { updated_health_status };

      if (file) {
        const resizedImageBuffer = await convertAndResizeImage(file.path);
        updatedData.updated_image = resizedImageBuffer;
        fs.unlinkSync(file.path); // Clean up file
      }

      const updatedVersion = await prisma.version.update({
        where: { id_version: parseInt(versionId) },
        data: updatedData,
      });

      res.json(updatedVersion);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to update version", details: error.message });
    }
  };

  deleteVersion = async (req: CustomRequest, res: Response): Promise<void> => {
    const { plantId, versionId } = req.params;
    const userId = req.user?.userId;

    try {
      // Validate plant ownership
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(plantId) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      // Validate version association and delete
      const deleteResult = await prisma.version.deleteMany({
        where: {
          id_version: parseInt(versionId),
          plantId: parseInt(plantId),
        },
      });

      if (deleteResult.count === 0) {
        res.status(404).json({ error: "Version not found for this plant" });
        return;
      }

      res.status(200).json({ message: "Version deleted successfully" });
    } catch (error: any) {
      if (error.code === "P2025") {
        // Prisma-specific error for record not found
        res.status(404).json({ error: "Version not found or already deleted" });
      } else {
        res
          .status(500)
          .json({ error: "Failed to delete version", details: error.message });
      }
    }
  };

  // Get Grad-CAM heatmap for a specific version image
  getHeatmap = async (req: Request, res: Response): Promise<void> => {
    const { plantId, versionId } = req.params;

    try {
      // Retrieve version to get the image data
      const version = await prisma.version.findUnique({
        where: { id_version: parseInt(versionId) },
      });

      if (!version || !version.updated_image) {
        res.status(404).json({ error: "Version not found or has no image" });
        return;
      }

      // Prepare image for Flask API
      const formData = new FormData();
      formData.append("file", version.updated_image, "image.jpg");

      // Send image to Flask API for Grad-CAM heatmap
      const flaskResponse = await axios.post(
        `${process.env.FLASK_API_URL}/gradcam`,
        formData,
        { headers: { ...formData.getHeaders() } }
      );

      // Stream the heatmap image back to the client
      res.set("Content-Type", flaskResponse.headers["content-type"]);
      res.send(flaskResponse.data);
    } catch (error) {
      console.error("Error generating heatmap:", (error as any).message);
      res.status(500).json({ error: "Failed to generate heatmap" });
    }
  };
}

export default new VersionController();
