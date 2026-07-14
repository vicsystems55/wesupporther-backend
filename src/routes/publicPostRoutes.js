import express from "express";
import { getPublishedPost, listPublishedPosts } from "../controllers/postController.js";
import { listPublicPostCategories } from "../controllers/postCategoryController.js";

const router = express.Router();

router.get("/posts", listPublishedPosts);
router.get("/posts/:slug", getPublishedPost);
router.get("/post-categories", listPublicPostCategories);

export default router;
