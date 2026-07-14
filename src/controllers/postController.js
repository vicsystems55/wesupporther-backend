import prisma from "../config/database.js";
import {
  createPost as createPostRecord,
  deletePost as deletePostRecord,
  publishPost as publishPostRecord,
  publishedWhere,
  unpublishPost as unpublishPostRecord,
  updatePost as updatePostRecord,
} from "../services/postService.js";
import {
  adminPostQuerySchema,
  createPostSchema,
  publicPostQuerySchema,
  updatePostSchema,
} from "../validators/postValidator.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validationError = (res, result) => res.status(422).json({
  message: "Please check the information provided.",
  errors: result.error.flatten().fieldErrors,
});

const postListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  featuredImageAlt: true,
  status: true,
  isFeatured: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
};

export const listPublishedPosts = async (req, res) => {
  try {
    const result = publicPostQuerySchema.safeParse(req.query);
    if (!result.success) return validationError(res, result);

    const { page, limit, category, search, featured } = result.data;
    const where = {
      ...publishedWhere(),
      ...(category ? { category: { slug: category } } : {}),
      ...(featured !== undefined ? { isFeatured: featured } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { excerpt: { contains: search } },
            ],
          }
        : {}),
    };

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: postListSelect,
      }),
      prisma.post.count({ where }),
    ]);

    return res.json({
      data: { posts },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to list published posts:", error);
    return res.status(500).json({ message: "Unable to load posts." });
  }
};

export const getPublishedPost = async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: { slug: req.params.slug, ...publishedWhere() },
      include: { category: true },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const relatedPosts = await prisma.post.findMany({
      where: {
        ...publishedWhere(),
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: postListSelect,
    });

    return res.json({ data: { post, relatedPosts } });
  } catch (error) {
    console.error("Failed to load published post:", error);
    return res.status(500).json({ message: "Unable to load post." });
  }
};

export const listAdminPosts = async (req, res) => {
  try {
    const result = adminPostQuerySchema.safeParse(req.query);
    if (!result.success) return validationError(res, result);

    const { page, limit, status, category, search, sort } = result.data;
    const where = {
      ...(status ? { status } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(search
        ? { OR: [{ title: { contains: search } }, { excerpt: { contains: search } }] }
        : {}),
    };

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit,
        select: postListSelect,
      }),
      prisma.post.count({ where }),
    ]);

    return res.json({
      data: { posts },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to list admin posts:", error);
    return res.status(500).json({ message: "Unable to load posts." });
  }
};

export const getAdminPost = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    const post = await prisma.post.findUnique({ where: { id }, include: { category: true } });
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json({ data: { post } });
  } catch (error) {
    console.error("Failed to load admin post:", error);
    return res.status(500).json({ message: "Unable to load post." });
  }
};

export const createAdminPost = async (req, res) => {
  try {
    const result = createPostSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const post = await createPostRecord(result.data);
    return res.status(201).json({ message: "Post created", data: { post } });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error("Failed to create post:", error);
    return res.status(500).json({ message: "Unable to create post." });
  }
};

export const updateAdminPost = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    const result = updatePostSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const post = await updatePostRecord(id, result.data);
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json({ message: "Post updated", data: { post } });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    console.error("Failed to update post:", error);
    return res.status(500).json({ message: "Unable to update post." });
  }
};

export const deleteAdminPost = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    await deletePostRecord(id);
    return res.json({ message: "Post deleted" });
  } catch (error) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Post not found" });
    console.error("Failed to delete post:", error);
    return res.status(500).json({ message: "Unable to delete post." });
  }
};

const changePublishStatus = async (req, res, action) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    const post = await action(id);
    return res.json({ message: `Post ${post.status === "PUBLISHED" ? "published" : "unpublished"}`, data: { post } });
  } catch (error) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Post not found" });
    console.error("Failed to change post publishing status:", error);
    return res.status(500).json({ message: "Unable to change publishing status." });
  }
};

export const publishAdminPost = (req, res) => changePublishStatus(req, res, publishPostRecord);
export const unpublishAdminPost = (req, res) => changePublishStatus(req, res, unpublishPostRecord);
