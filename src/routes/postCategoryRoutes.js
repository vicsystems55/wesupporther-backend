import express from "express";
import {
  createPostCategory,
  deletePostCategory,
  listAdminPostCategories,
  updatePostCategory,
} from "../controllers/postCategoryController.js";

const router = express.Router();

router.get("/", listAdminPostCategories);
router.post("/", createPostCategory);
router.patch("/:id", updatePostCategory);
router.delete("/:id", deletePostCategory);

export default router;
