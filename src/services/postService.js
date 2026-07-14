import sanitizeHtml from "sanitize-html";
import prisma from "../config/database.js";
import { generateUniqueSlug } from "../utils/slugify.js";

const sanitizePostContent = (content) => sanitizeHtml(content, {
  allowedTags: [
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i",
    "u", "s", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption",
    "hr", "pre", "code",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }, true),
  },
});

const assertCategoryExists = async (categoryId) => {
  if (!categoryId) return;
  const category = await prisma.postCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    const error = new Error("Post category not found");
    error.statusCode = 422;
    throw error;
  }
};

const preparePostData = async (input, existingPost) => {
  await assertCategoryExists(input.categoryId);
  const data = { ...input };

  if (input.content !== undefined) {
    data.content = sanitizePostContent(input.content);
    if (!data.content.trim()) {
      const error = new Error("Post content cannot be empty after sanitization");
      error.statusCode = 422;
      throw error;
    }
  }
  if (input.title !== undefined) {
    data.slug = await generateUniqueSlug({
      model: prisma.post,
      value: input.title,
      excludeId: existingPost?.id,
    });
  }

  const nextStatus = input.status ?? existingPost?.status ?? "DRAFT";
  if (nextStatus === "PUBLISHED" && !existingPost?.publishedAt) data.publishedAt = new Date();
  if (nextStatus === "DRAFT" && input.status === "DRAFT") data.publishedAt = null;

  return data;
};

export const createPost = async (input) => prisma.post.create({
  data: await preparePostData(input),
  include: { category: true },
});

export const updatePost = async (id, input) => {
  const existingPost = await prisma.post.findUnique({ where: { id } });
  if (!existingPost) return null;
  return prisma.post.update({
    where: { id },
    data: await preparePostData(input, existingPost),
    include: { category: true },
  });
};

export const publishPost = (id) => prisma.post.update({
  where: { id },
  data: { status: "PUBLISHED", publishedAt: new Date() },
  include: { category: true },
});

export const unpublishPost = (id) => prisma.post.update({
  where: { id },
  data: { status: "DRAFT", publishedAt: null },
  include: { category: true },
});

export const deletePost = (id) => prisma.post.delete({ where: { id } });

export const publishedWhere = (now = new Date()) => ({
  status: "PUBLISHED",
  publishedAt: { lte: now },
});
