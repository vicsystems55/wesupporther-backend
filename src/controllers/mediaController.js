import { uploadPostImage } from "../services/imageUploadService.js";

export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) return res.status(422).json({ message: "An image file is required" });
    const image = await uploadPostImage(req.file);
    return res.status(201).json({ data: image });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error("Failed to upload blog image:", error);
    return res.status(502).json({ message: "Unable to upload image." });
  }
};
