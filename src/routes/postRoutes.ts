import { Router } from "express";
import PostController from "../controllers/PostController";
import { uploadFile } from "../middleware/upload";

const router = Router();

router.get("/posts", PostController.getAllPosts);
router.get("/posts/:id", PostController.getPostById);
router.post("/posts", uploadFile, PostController.createPost);
router.put("/posts/:id", uploadFile, PostController.updatePost);
router.delete("/posts/:id", PostController.deletePost);
//router.post('/upload', uploadFile, PostController.uploadPicture);

export default router;
