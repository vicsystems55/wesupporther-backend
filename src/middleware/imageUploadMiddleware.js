import multer from "multer";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      const error = new Error("Only JPEG, PNG, WebP, GIF, or AVIF images are allowed");
      error.statusCode = 422;
      return callback(error);
    }
    return callback(null, true);
  },
});

export const receivePostImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Image must be 5 MB or smaller" });
    }
    return res.status(error.statusCode || 422).json({ message: error.message || "Invalid image upload" });
  });
};
