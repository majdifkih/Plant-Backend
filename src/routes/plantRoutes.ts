import express from "express";
import PlantController from "../controllers/PlantController";
import { authenticateToken } from "../middleware/authMiddleware";
import { uploadFile } from "../middleware/upload";

const router = express.Router();

router.post(
  "/predict",
  authenticateToken,
  uploadFile,
  PlantController.predictPlant
);
router.post("/", authenticateToken, uploadFile, PlantController.createPlant);
router.get("/", authenticateToken, PlantController.getAllPlants);
router.get("/:id_plant", authenticateToken, PlantController.getPlantById);
router.get(
  "/:id_plant/image",
  authenticateToken,
  PlantController.getPlantImageOriginal
);
router.put(
  "/:id_plant",
  authenticateToken,
  uploadFile,
  PlantController.updatePlant
);
router.delete("/:id_plant", authenticateToken, PlantController.deletePlant);
// Route for getting the heatmap of a plant's initial image
router.get(
  "/:id_plant/heatmapdb",
  authenticateToken,
  PlantController.getPlantHeatmap
);
router.post(
  "/heatmap",
  authenticateToken,
  uploadFile,
  PlantController.generateHeatmap
);

export default router;
