import prisma from "../config/database.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createNewsletterSubscription = async (req, res) => {
  try {
    if (req.body?.fullName !== undefined && typeof req.body.fullName !== "string") {
      return res.status(400).json({ message: "fullName must be a string" });
    }

    const email = typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
    const fullName = typeof req.body?.fullName === "string"
      ? req.body.fullName.trim() || null
      : null;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Email must be valid" });
    }

    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber?.status === "ACTIVE") {
      return res.status(200).json({
        message: "Email is already subscribed",
        subscriber: existingSubscriber,
      });
    }

    const subscriber = existingSubscriber
      ? await prisma.newsletterSubscriber.update({
          where: { email },
          data: {
            fullName: fullName ?? existingSubscriber.fullName,
            status: "ACTIVE",
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
        })
      : await prisma.newsletterSubscriber.create({
          data: { email, fullName },
        });

    return res.status(existingSubscriber ? 200 : 201).json({
      message: existingSubscriber
        ? "Newsletter subscription reactivated successfully"
        : "Newsletter subscription created successfully",
      subscriber,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      const email = typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
      const subscriber = email
        ? await prisma.newsletterSubscriber.findUnique({ where: { email } })
        : null;
      return res.status(200).json({ message: "Email is already subscribed", subscriber });
    }

    console.error("Failed to create newsletter subscription:", error);
    return res.status(500).json({ message: "Unable to create newsletter subscription" });
  }
};
