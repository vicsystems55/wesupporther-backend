import { getGoogleAnalyticsDashboard } from "../services/googleAnalyticsService.js";

const ALLOWED_PERIODS = [7, 30, 90];

export const getAnalytics = async (req, res) => {
  const period = req.query.period === undefined ? 30 : Number(req.query.period);

  if (!ALLOWED_PERIODS.includes(period)) {
    return res.status(400).json({ message: "Period must be 7, 30, or 90 days." });
  }

  try {
    const analytics = await getGoogleAnalyticsDashboard(period);
    return res.json({ data: analytics });
  } catch (error) {
    if (error?.code === "GA4_NOT_CONFIGURED") {
      return res.status(503).json({
        message: "Google Analytics reporting has not been configured on the server.",
      });
    }

    if (error?.code === 7) {
      return res.status(502).json({
        message: "The Google Analytics service account does not have access to this GA4 property.",
      });
    }

    console.error("Failed to load Google Analytics reports:", error);
    return res.status(502).json({ message: "Unable to retrieve Google Analytics reports." });
  }
};
