import prisma from "../config/database.js";
import { generateUniqueSlug } from "../utils/slugify.js";
import { createCategorySchema, updateCategorySchema } from "../validators/postValidator.js";
import { publishedWhere } from "../services/postService.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validationError = (res, result) => res.status(422).json({
  message: "Please check the information provided.",
  errors: result.error.flatten().fieldErrors,
});

export const listPublicPostCategories = async (_req, res) => {
  try {
    const categories = await prisma.postCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { posts: { where: publishedWhere() } } },
      },
    });
    return res.json({ data: { categories } });
  } catch (error) {
    console.error("Failed to list public post categories:", error);
    return res.status(500).json({ message: "Unable to load post categories." });
  }
};

export const listAdminPostCategories = async (_req, res) => {
  try {
    const categories = await prisma.postCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    return res.json({ data: { categories } });
  } catch (error) {
    console.error("Failed to list post categories:", error);
    return res.status(500).json({ message: "Unable to load post categories." });
  }
};

export const createPostCategory = async (req, res) => {
  try {
    const result = createCategorySchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const category = await prisma.postCategory.create({
      data: {
        ...result.data,
        slug: await generateUniqueSlug({ model: prisma.postCategory, value: result.data.name }),
      },
    });
    return res.status(201).json({ message: "Post category created", data: { category } });
  } catch (error) {
    console.error("Failed to create post category:", error);
    return res.status(500).json({ message: "Unable to create post category." });
  }
};

export const updatePostCategory = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    const result = updateCategorySchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);

    const existing = await prisma.postCategory.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Post category not found" });
    const category = await prisma.postCategory.update({
      where: { id },
      data: {
        ...result.data,
        ...(result.data.name
          ? { slug: await generateUniqueSlug({ model: prisma.postCategory, value: result.data.name, excludeId: id }) }
          : {}),
      },
    });
    return res.json({ message: "Post category updated", data: { category } });
  } catch (error) {
    console.error("Failed to update post category:", error);
    return res.status(500).json({ message: "Unable to update post category." });
  }
};

export const deletePostCategory = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    await prisma.postCategory.delete({ where: { id } });
    return res.json({ message: "Post category deleted" });
  } catch (error) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Post category not found" });
    console.error("Failed to delete post category:", error);
    return res.status(500).json({ message: "Unable to delete post category." });
  }
};
