import { z } from "zod";

export const CONTACT_SUBMISSION_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"];

export const contactSubmissionSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().optional().default(""),
}).strict();

export const contactListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(CONTACT_SUBMISSION_STATUSES).optional(),
  search: z.string().trim().max(160).optional().default(""),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export const contactStatusSchema = z.object({
  status: z.enum(CONTACT_SUBMISSION_STATUSES),
}).strict();
