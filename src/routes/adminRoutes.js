import express from "express";
import {
  listNewsletterSubscribers,
  listVolunteerApplications,
  updateNewsletterStatus,
  updateVolunteerStatus,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import { getAnalytics } from "../controllers/analyticsController.js";
import {
  getContactSubmission,
  listContactSubmissions,
  updateContactSubmissionStatus,
} from "../controllers/contactController.js";
import adminPostRoutes from "./adminPostRoutes.js";
import postCategoryRoutes from "./postCategoryRoutes.js";
import mediaRoutes from "./mediaRoutes.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/volunteer-applications", listVolunteerApplications);
router.patch("/volunteer-applications/:id/status", updateVolunteerStatus);
router.get("/newsletter/subscribers", listNewsletterSubscribers);
router.patch("/newsletter/subscribers/:id/status", updateNewsletterStatus);
router.get("/analytics", getAnalytics);
router.get("/contact-submissions", listContactSubmissions);
router.get("/contact-submissions/:id", getContactSubmission);
router.patch("/contact-submissions/:id/status", updateContactSubmissionStatus);
router.use("/posts", adminPostRoutes);
router.use("/post-categories", postCategoryRoutes);
router.use("/media", mediaRoutes);

export default router;
