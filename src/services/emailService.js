import { Resend } from "resend";
import { buildVolunteerApplicationEmail } from "../templates/volunteerApplicationEmail.js";

let resendClient;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

export const sendVolunteerApplicationNotification = async (application) => {
  const resend = getResendClient();

  if (!resend) {
    console.warn("Volunteer email skipped: RESEND_API_KEY is not configured");
    return { skipped: true };
  }

  const to = process.env.VOLUNTEER_NOTIFICATION_EMAIL || "zainab.ajao@wesupporther.org";
  const from = process.env.EMAIL_FROM || "We Support Her <notifications@wesupporther.org>";
  const { html, text } = buildVolunteerApplicationEmail({
    application,
    dashboardUrl: process.env.ADMIN_DASHBOARD_URL,
    logoUrl: process.env.EMAIL_LOGO_URL,
  });

  const { data, error } = await resend.emails.send(
    {
      from,
      to: [to],
      replyTo: application.email,
      subject: `New volunteer application — ${application.fullName}`,
      html,
      text,
    },
    { idempotencyKey: `volunteer-application/${application.id}` },
  );

  if (error) {
    throw new Error(error.message || "Resend rejected the email request");
  }

  return data;
};
