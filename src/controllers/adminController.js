import prisma from "../config/database.js";

const VOLUNTEER_STATUSES = ["Pending", "Reviewing", "Approved", "Rejected"];
const SUBSCRIBER_STATUSES = ["ACTIVE", "UNSUBSCRIBED"];

const parseListQuery = (query, allowedStatuses) => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const requestedLimit = query.limit === undefined ? 10 : Number(query.limit);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const status = typeof query.status === "string" ? query.status.trim() : "";
  const errors = [];

  if (!Number.isInteger(page) || page < 1) errors.push("page must be a positive integer");
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    errors.push("limit must be a positive integer");
  }
  if (status && !allowedStatuses.includes(status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}`);
  }

  return {
    errors,
    page,
    limit: Math.min(requestedLimit, 100),
    search,
    status,
  };
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const listVolunteerApplications = async (req, res) => {
  try {
    const { errors, page, limit, search, status } = parseListQuery(
      req.query,
      VOLUNTEER_STATUSES,
    );

    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
              { position: { contains: search } },
            ],
          }
        : {}),
    };

    const [applications, filteredTotal, total, statusCounts] = await prisma.$transaction([
      prisma.volunteerApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.volunteerApplication.count({ where }),
      prisma.volunteerApplication.count(),
      prisma.volunteerApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const countFor = (value) => statusCounts.find((item) => item.status === value)?._count._all ?? 0;

    return res.json({
      data: {
        applications,
        summary: {
          total,
          pending: countFor("Pending"),
          approved: countFor("Approved"),
        },
      },
      meta: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error) {
    console.error("Failed to list volunteer applications:", error);
    return res.status(500).json({ message: "Unable to load volunteer applications" });
  }
};

export const updateVolunteerStatus = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const status = req.body?.status;

    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    if (!VOLUNTEER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${VOLUNTEER_STATUSES.join(", ")}`,
      });
    }

    const application = await prisma.volunteerApplication.update({
      where: { id },
      data: { status },
    });

    return res.json({ message: "Volunteer application status updated", data: { application } });
  } catch (error) {
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Volunteer application not found" });
    }

    console.error("Failed to update volunteer status:", error);
    return res.status(500).json({ message: "Unable to update volunteer application" });
  }
};

export const listNewsletterSubscribers = async (req, res) => {
  try {
    const { errors, page, limit, search, status } = parseListQuery(
      req.query,
      SUBSCRIBER_STATUSES,
    );

    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? { OR: [{ fullName: { contains: search } }, { email: { contains: search } }] }
        : {}),
    };

    const [subscribers, filteredTotal, total, statusCounts] = await prisma.$transaction([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const countFor = (value) => statusCounts.find((item) => item.status === value)?._count._all ?? 0;

    return res.json({
      data: {
        subscribers,
        summary: {
          total,
          active: countFor("ACTIVE"),
          unsubscribed: countFor("UNSUBSCRIBED"),
        },
      },
      meta: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error) {
    console.error("Failed to list newsletter subscribers:", error);
    return res.status(500).json({ message: "Unable to load newsletter subscribers" });
  }
};

export const updateNewsletterStatus = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const status = req.body?.status;

    if (!id) return res.status(400).json({ message: "id must be a positive integer" });
    if (!SUBSCRIBER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${SUBSCRIBER_STATUSES.join(", ")}`,
      });
    }

    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        status,
        unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null,
      },
    });

    return res.json({ message: "Newsletter subscriber status updated", data: { subscriber } });
  } catch (error) {
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Newsletter subscriber not found" });
    }

    console.error("Failed to update newsletter status:", error);
    return res.status(500).json({ message: "Unable to update newsletter subscriber" });
  }
};
