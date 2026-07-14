import rateLimit from "express-rate-limit";

export const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many messages submitted. Please try again later.",
  },
});
