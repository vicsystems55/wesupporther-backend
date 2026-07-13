import express from "express";
import {
  listNewsletterSubscribers,
  listVolunteerApplications,
  updateNewsletterStatus,
  updateVolunteerStatus,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/volunteer-applications", listVolunteerApplications);
router.patch("/volunteer-applications/:id/status", updateVolunteerStatus);
router.get("/newsletter/subscribers", listNewsletterSubscribers);
router.patch("/newsletter/subscribers/:id/status", updateNewsletterStatus);

export default router;
