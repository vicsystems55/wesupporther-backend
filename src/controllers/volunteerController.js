import prisma from "../config/database.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optionalString = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" ? value.trim() : value;
};

const optionalDate = (value, field, errors) => {
  if (value === undefined || value === null || value === "") return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push(`${field} must be a valid date`);
    return null;
  }

  return date;
};

export const createVolunteerApplication = async (req, res) => {
  try {
    const body = req.body ?? {};
    const errors = [];
    const fullName = optionalString(body.fullName);
    const email = optionalString(body.email)?.toLowerCase();
    const phone = optionalString(body.phone);

    if (!fullName || typeof fullName !== "string") errors.push("fullName is required");
    if (!email || typeof email !== "string") {
      errors.push("email is required");
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.push("email must be valid");
    }
    if (!phone || typeof phone !== "string") errors.push("phone is required");

    const optionalStringFields = [
      "gender",
      "nationality",
      "occupation",
      "address",
      "emergencyName",
      "emergencyPhone",
      "position",
      "duration",
      "arrangement",
      "supervisor",
      "volunteerName",
      "signature",
    ];

    for (const field of optionalStringFields) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== "string") {
        errors.push(`${field} must be a string`);
      }
    }

    for (const field of ["department", "agreements"]) {
      if (body[field] !== undefined && !Array.isArray(body[field])) {
        errors.push(`${field} must be an array`);
      } else if (Array.isArray(body[field]) && body[field].some((item) => typeof item !== "string")) {
        errors.push(`${field} must contain only strings`);
      }
    }

    if (body.mediaConsent !== undefined && typeof body.mediaConsent !== "boolean") {
      errors.push("mediaConsent must be a boolean");
    }

    const dates = {
      dob: optionalDate(body.dob, "dob", errors),
      startDate: optionalDate(body.startDate, "startDate", errors),
      declarationDate: optionalDate(body.declarationDate, "declarationDate", errors),
    };

    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const application = await prisma.volunteerApplication.create({
      data: {
        fullName,
        email,
        phone,
        dob: dates.dob,
        gender: optionalString(body.gender),
        nationality: optionalString(body.nationality),
        occupation: optionalString(body.occupation),
        address: optionalString(body.address),
        emergencyName: optionalString(body.emergencyName),
        emergencyPhone: optionalString(body.emergencyPhone),
        position: optionalString(body.position),
        department: body.department ?? [],
        duration: optionalString(body.duration),
        arrangement: optionalString(body.arrangement),
        startDate: dates.startDate,
        supervisor: optionalString(body.supervisor),
        agreements: body.agreements ?? [],
        mediaConsent: body.mediaConsent ?? false,
        volunteerName: optionalString(body.volunteerName),
        signature: optionalString(body.signature),
        declarationDate: dates.declarationDate,
      },
    });

    return res.status(201).json({
      message: "Volunteer application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Failed to create volunteer application:", error);
    return res.status(500).json({ message: "Unable to submit volunteer application" });
  }
};
