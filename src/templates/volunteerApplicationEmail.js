const BRAND = {
  primary: "#7a1f8a",
  secondary: "#e65a12",
  accent: "#6a9f32",
  dark: "#2b0f33",
  cream: "#fff8f2",
  softPurple: "#f5e9f8",
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const displayValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
  if (value === true) return "Yes";
  if (value === false) return "No";
  return value || "Not provided";
};

const detailRow = (label, value) => `
  <tr>
    <td class="detail-label" style="padding:10px 12px;color:#6b6375;font-size:13px;font-weight:700;vertical-align:top;width:34%;border-bottom:1px solid #eee7f0;">
      ${escapeHtml(label)}
    </td>
    <td style="padding:10px 12px;color:${BRAND.dark};font-size:14px;line-height:1.5;vertical-align:top;border-bottom:1px solid #eee7f0;word-break:break-word;">
      ${escapeHtml(displayValue(value))}
    </td>
  </tr>`;

const formatDate = (value) => {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
};

export const buildVolunteerApplicationEmail = ({
  application,
  dashboardUrl,
  logoUrl,
}) => {
  const safeDashboardUrl = dashboardUrl ? escapeHtml(dashboardUrl) : null;
  const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : null;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <title>New volunteer application</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-shell { width: 100% !important; border-radius: 0 !important; }
        .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
        .detail-label { width: 38% !important; }
        .email-heading { font-size: 25px !important; }
        .button { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.cream};font-family:Arial,Helvetica,sans-serif;color:${BRAND.dark};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(application.fullName)} submitted a volunteer application.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.cream};">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table class="email-shell" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(43,15,51,.12);">
            <tr>
              <td class="email-padding" style="padding:28px 36px;background:${BRAND.primary};border-bottom:6px solid ${BRAND.secondary};">
                ${safeLogoUrl
                  ? `<img src="${safeLogoUrl}" width="180" alt="We Support Her" style="display:block;width:180px;max-width:70%;height:auto;">`
                  : '<div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:.3px;">WE SUPPORT HER</div>'}
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:36px 36px 18px;">
                <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:${BRAND.softPurple};color:${BRAND.primary};font-size:11px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;">
                  Volunteer application
                </div>
                <h1 class="email-heading" style="margin:18px 0 10px;color:${BRAND.dark};font-size:30px;line-height:1.2;">
                  A new application has arrived
                </h1>
                <p style="margin:0;color:#6b6375;font-size:15px;line-height:1.7;">
                  ${escapeHtml(application.fullName)} submitted an application through the We Support Her website. The key details are below.
                </p>
              </td>
            </tr>
            <tr>
              <td class="email-padding" style="padding:10px 36px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #eee7f0;border-radius:16px;border-collapse:separate;overflow:hidden;">
                  ${detailRow("Reference", `#${application.id}`)}
                  ${detailRow("Submitted", formatDate(application.createdAt))}
                  ${detailRow("Full name", application.fullName)}
                  ${detailRow("Email", application.email)}
                  ${detailRow("Phone", application.phone)}
                  ${detailRow("Position", application.position)}
                  ${detailRow("Department", application.department)}
                  ${detailRow("Arrangement", application.arrangement)}
                  ${detailRow("Duration", application.duration)}
                  ${detailRow("Preferred start", application.startDate ? formatDate(application.startDate) : null)}
                  ${detailRow("Media consent", application.mediaConsent)}
                </table>
              </td>
            </tr>
            ${safeDashboardUrl ? `
            <tr>
              <td class="email-padding" style="padding:0 36px 36px;">
                <a class="button" href="${safeDashboardUrl}" style="display:inline-block;padding:15px 24px;border-radius:12px;background:${BRAND.secondary};color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">
                  Review application
                </a>
              </td>
            </tr>` : ""}
            <tr>
              <td class="email-padding" style="padding:22px 36px;background:${BRAND.dark};color:#ffffff;">
                <p style="margin:0;font-size:12px;line-height:1.6;opacity:.85;">
                  This automated notification was sent by the We Support Her website. Sensitive declaration and signature details remain available only in the protected admin dashboard.
                </p>
              </td>
            </tr>
            <tr><td style="height:5px;background:${BRAND.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "NEW VOLUNTEER APPLICATION",
    "",
    `${application.fullName} submitted a volunteer application.`,
    `Reference: #${application.id}`,
    `Submitted: ${formatDate(application.createdAt)}`,
    `Email: ${application.email}`,
    `Phone: ${application.phone}`,
    `Position: ${displayValue(application.position)}`,
    `Department: ${displayValue(application.department)}`,
    `Arrangement: ${displayValue(application.arrangement)}`,
    dashboardUrl ? `Review application: ${dashboardUrl}` : "",
  ].filter(Boolean).join("\n");

  return { html, text };
};
