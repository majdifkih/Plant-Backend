import { Router } from "express";
import VersionController from "../controllers/VersionsController";
import { authenticateToken } from "../middleware/authMiddleware";
import { uploadFile } from "../middleware/upload";

const router = Router();

router.use(authenticateToken);

router.post("/:plantId/versions", uploadFile, VersionController.createVersion);

router.get("/:plantId/versions", VersionController.getAllVersions);

router.get("/:plantId/versions/:versionId", VersionController.getVersionById);

router.put(
  ":plantId/versions/:versionId",
  uploadFile,
  VersionController.updateVersion
);

router.delete("/:plantId/versions/:versionId", VersionController.deleteVersion);

router.get(
  "/:plantId/versions/:versionId/heatmap",
  VersionController.getHeatmap
);

export default router;
