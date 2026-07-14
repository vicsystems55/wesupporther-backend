import prisma from "../config/database.js";
import { sendContactSubmissionNotification } from "../services/emailService.js";
import {
  contactListQuerySchema,
  contactStatusSchema,
  contactSubmissionSchema,
} from "../validators/contactValidator.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validationResponse = (res, result) => res.status(422).json({
  message: "Please check the information you entered.",
  errors: result.error.flatten().fieldErrors,
});

export const createContactSubmission = async (req, res) => {
  try {
    const body = req.body ?? {};

    // Silently accept honeypot submissions so bots are not told they were detected.
    if (typeof body.website === "string" && body.website.trim()) {
      return res.status(201).json({ message: "Your message has been received." });
    }

    const result = contactSubmissionSchema.safeParse(body);
    if (!result.success) return validationResponse(res, result);

    const { website: _website, ...data } = result.data;
    const submission = await prisma.contactSubmission.create({ data });

    try {
      await sendContactSubmissionNotification(submission);
    } catch (notificationError) {
      console.error(
        `Contact submission ${submission.id} was saved but its notification email failed:`,
        notificationError,
      );
    }

    return res.status(201).json({
      message: "Your message has been received.",
      data: { id: submission.id, createdAt: submission.createdAt },
    });
  } catch (error) {
    console.error("Failed to create contact submission:", error);
    return res.status(500).json({ message: "Unable to submit your message." });
  }
};

export const listContactSubmissions = async (req, res) => {
  try {
    const result = contactListQuerySchema.safeParse(req.query);
    if (!result.success) return validationResponse(res, result);

    const { page, limit, status, search, sort } = result.data;
    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search } },
              { email: { contains: search } },
              { subject: { contains: search } },
              { message: { contains: search } },
            ],
          }
        : {}),
    };

    const [submissions, total] = await prisma.$transaction([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          subject: true,
          status: true,
          respondedAt: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contactSubmission.count({ where }),
    ]);

    return res.json({
      data: { submissions },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to list contact submissions:", error);
    return res.status(500).json({ message: "Unable to load contact submissions." });
  }
};

export const getContactSubmission = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });

    const submission = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!submission) return res.status(404).json({ message: "Contact submission not found" });

    return res.json({ data: { submission } });
  } catch (error) {
    console.error("Failed to load contact submission:", error);
    return res.status(500).json({ message: "Unable to load contact submission." });
  }
};

export const updateContactSubmissionStatus = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "id must be a positive integer" });

    const result = contactStatusSchema.safeParse(req.body);
    if (!result.success) return validationResponse(res, result);

    const { status } = result.data;
    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: {
        status,
        ...(status === "REPLIED" ? { respondedAt: new Date() } : {}),
        archivedAt: status === "ARCHIVED" ? new Date() : null,
      },
    });

    return res.json({
      message: "Contact submission status updated",
      data: { submission },
    });
  } catch (error) {
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Contact submission not found" });
    }

    console.error("Failed to update contact submission status:", error);
    return res.status(500).json({ message: "Unable to update contact submission." });
  }
};
