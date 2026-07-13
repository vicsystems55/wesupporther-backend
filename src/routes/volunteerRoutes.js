import express from "express";
import { createVolunteerApplication } from "../controllers/volunteerController.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

const submissionRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many volunteer applications from this address. Please try again later.",
});

router.post("/", submissionRateLimit, createVolunteerApplication);

export default router;
