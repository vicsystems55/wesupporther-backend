import { z } from "zod";

const httpUrl = z.string().trim().max(2048).url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, { message: "URL must use HTTP or HTTPS" });

const nullableUrl = z.union([httpUrl, z.literal(""), z.null()])
  .transform((value) => value || null);

const nullableString = (max) => z.union([z.string().trim().max(max), z.null()])
  .transform((value) => value || null);

const postFields = {
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().min(10).max(2000),
  content: z.string().trim().min(1).max(1_000_000),
  featuredImage: nullableUrl.optional(),
  featuredImageAlt: nullableString(255).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  isFeatured: z.boolean().optional(),
  categoryId: z.union([z.number().int().positive(), z.null()]).optional(),
  seoTitle: nullableString(200).optional(),
  seoDescription: nullableString(320).optional(),
};

export const createPostSchema = z.object(postFields).strict();
export const updatePostSchema = z.object(postFields).partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" },
);

export const publicPostQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(9),
  category: z.string().trim().max(140).optional(),
  search: z.string().trim().max(200).optional(),
  featured: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export const adminPostQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  category: z.string().trim().max(140).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

const categoryFields = {
  name: z.string().trim().min(2).max(120),
  description: nullableString(1000).optional(),
};

export const createCategorySchema = z.object(categoryFields).strict();
export const updateCategorySchema = z.object(categoryFields).partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" },
);
