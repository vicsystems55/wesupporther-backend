import express from "express";
import { createNewsletterSubscription } from "../controllers/newsletterController.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

const subscriptionRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many subscription requests from this address. Please try again later.",
});

router.post("/subscriptions", subscriptionRateLimit, createNewsletterSubscription);

export default router;
