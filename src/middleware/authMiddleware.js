import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "A Bearer token is required" });
    }

    const token = authorization.slice(7).trim();
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.admin.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin account not found" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin account is inactive" });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token has expired" });
    }

    if (error?.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    console.error("Admin authentication failed:", error);
    return res.status(500).json({ message: "Unable to authenticate request" });
  }
};
