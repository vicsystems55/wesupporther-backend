import express from "express";
import {
  createAdminPost,
  deleteAdminPost,
  getAdminPost,
  listAdminPosts,
  publishAdminPost,
  unpublishAdminPost,
  updateAdminPost,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", listAdminPosts);
router.post("/", createAdminPost);
router.patch("/:id/publish", publishAdminPost);
router.patch("/:id/unpublish", unpublishAdminPost);
router.get("/:id", getAdminPost);
router.patch("/:id", updateAdminPost);
router.delete("/:id", deleteAdminPost);

export default router;
