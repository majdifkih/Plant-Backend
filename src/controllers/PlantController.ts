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

class PlantController {
  // Predict plant health without creating a record in the database
  predictPlant = async (req: CustomRequest, res: Response): Promise<void> => {
    const file = req.file;

    // Ensure file is uploaded
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      // Convert and resize the image
      const resizedImageBuffer = await convertAndResizeImage(file.path);

      // Prepare and send file to Flask API
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

      const { plant_name, health_status, confidence, message } =
        flaskResponse.data;

      // Format confidence to 2 decimal places
      //const formattedConfidence = parseFloat(confidence).toFixed(2);

      // make the confidence score a percentage
      const formattedConfidence = `${(confidence * 100).toFixed(2)}`;

      // Return prediction data without saving it to the database
      res.json({
        plant_name,
        health_status,
        confidence: formattedConfidence,
        message,
      });
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to predict plant health",
        details: error.message,
      });
    } finally {
      fs.unlinkSync(file.path); // Clean up file
    }
  };

  // Create a new plant and save it in the database
  createPlant = async (req: CustomRequest, res: Response): Promise<void> => {
    const { description } = req.body;
    const file = req.file;

    // Ensure file is uploaded
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Ensure userId is available from req.user
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID not found" });
      return;
    }

    try {
      // Convert and resize the image
      const resizedImageBuffer = await convertAndResizeImage(file.path);

      // Prepare and send file to Flask API
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

      const { plant_name, health_status } = flaskResponse.data;

      // Save plant data to PostgreSQL database including the plant_image as binary
      const newPlant = await prisma.plant.create({
        data: {
          plant_name,
          description,
          health_status,
          userId,
          plant_image: resizedImageBuffer, // Store the image as binary data
        },
      });

      res.status(201).json(newPlant);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to create plant", details: error.message });
    } finally {
      fs.unlinkSync(file.path); // Clean up file
    }
  };

  // Get all plants for the authenticated user
  getAllPlants = async (req: CustomRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    try {
      const plants = await prisma.plant.findMany({
        where: { userId },
      });

      // Convert images to Base64 for easier frontend display
      const plantsWithBase64Images = plants.map((plant) => ({
        ...plant,
        plant_image: plant.plant_image
          ? convertImageToBase64(Buffer.from(plant.plant_image))
          : null,
      }));

      res.json(plantsWithBase64Images);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch plants", details: error.message });
    }
  };

  // Get a single plant by ID and return the image as Base64
  getPlantById = async (req: CustomRequest, res: Response): Promise<void> => {
    const { id_plant } = req.params;
    const userId = req.user?.userId;

    try {
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(id_plant) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      // Convert image to Base64 for easier frontend display
      const base64Image = plant.plant_image
        ? convertImageToBase64(Buffer.from(plant.plant_image))
        : null;

      res.json({
        ...plant,
        plant_image: base64Image,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch plant", details: error.message });
    }
  };

  getPlantImage = async (req: CustomRequest, res: Response): Promise<void> => {
    const { id_plant } = req.params;
    const userId = req.user?.userId;

    try {
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(id_plant) },
      });

      if (!plant || plant.userId !== userId || !plant.plant_image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      // Convert Base64 image back to binary
      const imageBuffer = Buffer.from(plant.plant_image!.toString(), "base64");

      // Set the content type and send the image data
      res.set("Content-Type", "image/jpeg");
      res.send(imageBuffer);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch plant image", details: error.message });
    }
  };

  // Update a plant by ID
  updatePlant = async (req: CustomRequest, res: Response): Promise<void> => {
    const { id_plant } = req.params;
    const { description, health_status } = req.body;
    const file = req.file;
    const userId = req.user?.userId;

    try {
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(id_plant) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      let updatedData: any = { description, health_status };

      if (file) {
        // Convert and resize the image
        const resizedImageBuffer = await convertAndResizeImage(file.path);

        // Prepare and send file to Flask API
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

        const { plant_name, health_status: new_health_status } =
          flaskResponse.data;
        updatedData = {
          ...updatedData,
          plant_name,
          health_status: new_health_status,
          plant_image: resizedImageBuffer, // Update the image data as well
        };

        fs.unlinkSync(file.path); // Clean up file
      }

      const updatedPlant = await prisma.plant.update({
        where: { id_plant: parseInt(id_plant) },
        data: updatedData,
      });

      res.json(updatedPlant);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to update plant", details: error.message });
    }
  };

  // Delete a plant by ID
  deletePlant = async (req: CustomRequest, res: Response): Promise<void> => {
    const { id_plant } = req.params;
    const userId = req.user?.userId;

    try {
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(id_plant) },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      await prisma.plant.delete({
        where: { id_plant: parseInt(id_plant) },
      });

      res.status(200).json({ message: "Plant deleted successfully" });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to delete plant", details: error.message });
    }
  };

  // Request heatmap from the Flask API for a specific plant's initial image
  getPlantHeatmap = async (
    req: CustomRequest,
    res: Response
  ): Promise<void> => {
    const { id_plant } = req.params;
    const userId = req.user?.userId;

    try {
      // Ensure the plant exists and belongs to the user
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(id_plant) },
        select: { plant_image: true, userId: true },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      // Verify the plant has an initial image
      if (!plant.plant_image) {
        res
          .status(400)
          .json({ error: "No initial image found for this plant" });
        return;
      }

      // Prepare the image for sending to the Flask API
      const formData = new FormData();
      formData.append("file", plant.plant_image, "initial_image.jpg");

      // Send the request to Flask API for the Grad-CAM heatmap
      const response = await axios.post(
        `${process.env.FLASK_API_GRADCAM}`,
        formData,
        {
          headers: formData.getHeaders(),
          responseType: "arraybuffer",
        }
      );

      // Return the heatmap as an image response
      res.set("Content-Type", "image/jpeg");
      res.send(response.data);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to generate heatmap", details: error.message });
    }
  };

  // generate hitmap from the file uploaded
  generateHeatmap = async (req: CustomRequest, res: Response): Promise<void> => {
    const file = req.file;

    // Ensure file is uploaded
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      // Prepare and send file to Flask API
      const formData = new FormData();
      formData.append("file", fs.createReadStream(file.path), file.originalname);

      const flaskResponse = await axios.post(
        `${process.env.FLASK_API_GRADCAM}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          responseType: "arraybuffer",
        }
      );

      // Return the heatmap image as an image response
      res.set("Content-Type", "image/jpeg");
      res.send(flaskResponse.data);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to generate heatmap", details: error.message });
    } finally {
      fs.unlinkSync(file.path); // Clean up file
    }
  };

  // get plant image from the database
  getPlantImageOriginal = async (
    req: CustomRequest,
    res: Response
  ): Promise<void> => {
    const { id_plant } = req.params;
    const userId = req.user?.userId;

    try {
      // Ensure the plant exists and belongs to the user
      const plant = await prisma.plant.findUnique({
        where: { id_plant: parseInt(id_plant) },
        select: { plant_image: true, userId: true },
      });

      if (!plant || plant.userId !== userId) {
        res.status(404).json({ error: "Plant not found or not owned by user" });
        return;
      }

      // Verify the plant has an initial image
      if (!plant.plant_image) {
        res
          .status(400)
          .json({ error: "No initial image found for this plant" });
        return;
      }

      // Prepare the image for sending to the Flask API
      const formData = new FormData();
      formData.append("file", plant.plant_image, "initial_image.png");

      // Return the image as an image response
      res.set("Content-Type", "image/png");
      res.send(plant.plant_image);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to generate heatmap", details: error.message });
    }
  };
}

export default new PlantController();
