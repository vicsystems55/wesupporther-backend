import express from "express";
import { uploadBlogImage } from "../controllers/mediaController.js";
import { receivePostImage } from "../middleware/imageUploadMiddleware.js";

const router = express.Router();

router.post("/upload", receivePostImage, uploadBlogImage);

export default router;
