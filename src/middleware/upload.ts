import multer from "multer";
import { Request, Response, NextFunction } from "express";

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Middleware for handling single file upload
export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  const singleUpload = upload.single("file");
  singleUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: "File upload failed", details: err.message });
    }
    next();
  });
};
