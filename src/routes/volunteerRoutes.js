import express from "express";
import { createVolunteerApplication } from "../controllers/volunteerController.js";

const router = express.Router();

router.post("/", createVolunteerApplication);

export default router;
