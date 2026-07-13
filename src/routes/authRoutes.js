import express from "express";
import { login, register } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/login", login);
router.post("/register", requireAdmin, register);


export default router;
