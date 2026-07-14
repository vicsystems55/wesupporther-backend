import express from "express";
import { createContactSubmission } from "../controllers/contactController.js";
import { contactFormLimiter } from "../middleware/contactRateLimitMiddleware.js";

const router = express.Router();

router.post("/contact-submissions", contactFormLimiter, createContactSubmission);

export default router;
