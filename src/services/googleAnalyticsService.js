import { BetaAnalyticsDataClient } from "@google-analytics/data";

const STANDARD_CACHE_MS = 10 * 60 * 1000;
const REALTIME_CACHE_MS = 45 * 1000;
const standardCache = new Map();
let realtimeCache;
let analyticsClient;

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const percent = (value) => asNumber(value) * 100;

const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getConfiguration = () => {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!propertyId || !/^\d+$/.test(propertyId) || !clientEmail || !privateKey) {
    const error = new Error("Google Analytics reporting is not configured");
    error.code = "GA4_NOT_CONFIGURED";
    throw error;
  }

  return { propertyId, clientEmail, privateKey };
};

const getClient = () => {
  const configuration = getConfiguration();
  analyticsClient ??= new BetaAnalyticsDataClient({
    credentials: {
      client_email: configuration.clientEmail,
      private_key: configuration.privateKey,
    },
  });

  return {
    client: analyticsClient,
    property: `properties/${configuration.propertyId}`,
  };
};

const metric = (row, index) => asNumber(row?.metricValues?.[index]?.value);
const dimension = (row, index) => row?.dimensionValues?.[index]?.value || "";

const formatGaDate = (value) => {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

const getDateRanges = (period) => ({
  current: { startDate: `${period - 1}daysAgo`, endDate: "today" },
  previous: { startDate: `${period * 2 - 1}daysAgo`, endDate: `${period}daysAgo` },
});

const runOverview = async (dateRange) => {
  const { client, property } = getClient();
  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "sessions" },
      { name: "bounceRate" },
    ],
  });
  const row = response.rows?.[0];

  return {
    visitors: metric(row, 0),
    pageViews: metric(row, 1),
    sessions: metric(row, 2),
    bounceRate: percent(row?.metricValues?.[3]?.value),
  };
};

const runTrend = async (period) => {
  const { client, property } = getClient();
  const [response] = await client.runReport({
    property,
    dateRanges: [getDateRanges(period).current],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: period,
  });

  return (response.rows ?? []).map((row) => ({
    date: formatGaDate(dimension(row, 0)),
    label: formatGaDate(dimension(row, 0)),
    visitors: metric(row, 0),
  }));
};

const runBreakdown = async ({ period, dimensionNames, limit = 100 }) => {
  const { client, property } = getClient();
  const [response] = await client.runReport({
    property,
    dateRanges: [getDateRanges(period).current],
    dimensions: dimensionNames.map((name) => ({ name })),
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit,
  });

  return response.rows ?? [];
};

const runTopPages = async (period) => {
  const { client, property } = getClient();
  const [response] = await client.runReport({
    property,
    dateRanges: [getDateRanges(period).current],
    dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
      { name: "userEngagementDuration" },
      { name: "bounceRate" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });

  return (response.rows ?? []).map((row) => {
    const visitors = metric(row, 1);
    const bounceRate = percent(row?.metricValues?.[3]?.value);

    return {
      title: dimension(row, 0) || "Untitled page",
      path: dimension(row, 1) || "/",
      views: metric(row, 0),
      visitors,
      averageTimeSeconds: visitors ? metric(row, 2) / visitors : 0,
      bounceRate,
      exitRate: bounceRate,
    };
  });
};

const addPercentages = (items) => {
  const total = items.reduce((sum, item) => sum + item.visitors, 0);
  return items.map((item) => ({
    ...item,
    percent: total ? (item.visitors / total) * 100 : 0,
  }));
};

const getStandardReports = async (period) => {
  const cached = standardCache.get(period);
  if (cached?.expiresAt > Date.now()) return cached.data;

  const { current, previous } = getDateRanges(period);
  const [overview, previousOverview, trend, sourceRows, countryRows, deviceRows, topPages] =
    await Promise.all([
      runOverview(current),
      runOverview(previous),
      runTrend(period),
      runBreakdown({ period, dimensionNames: ["sessionDefaultChannelGroup"] }),
      runBreakdown({ period, dimensionNames: ["countryId", "country"] }),
      runBreakdown({ period, dimensionNames: ["deviceCategory"], limit: 10 }),
      runTopPages(period),
    ]);

  const data = {
    overview: {
      ...overview,
      changes: {
        visitors: calculateChange(overview.visitors, previousOverview.visitors),
        pageViews: calculateChange(overview.pageViews, previousOverview.pageViews),
        sessions: calculateChange(overview.sessions, previousOverview.sessions),
        bounceRate: calculateChange(overview.bounceRate, previousOverview.bounceRate),
      },
    },
    trend,
    trafficSources: addPercentages(sourceRows.map((row) => ({
      label: dimension(row, 0) || "Unassigned",
      visitors: metric(row, 0),
    }))),
    countries: addPercentages(countryRows.map((row) => ({
      code: dimension(row, 0) || "--",
      name: dimension(row, 1) || "Unknown",
      visitors: metric(row, 0),
    }))),
    devices: addPercentages(deviceRows.map((row) => ({
      label: dimension(row, 0) || "Unknown",
      visitors: metric(row, 0),
    }))),
    topPages,
  };

  standardCache.set(period, { data, expiresAt: Date.now() + STANDARD_CACHE_MS });
  return data;
};

const getRealtimeReport = async () => {
  if (realtimeCache?.expiresAt > Date.now()) return realtimeCache.data;

  const { client, property } = getClient();
  const [response] = await client.runRealtimeReport({
    property,
    dimensions: [{ name: "unifiedScreenName" }],
    metrics: [{ name: "activeUsers" }],
    metricAggregations: ["TOTAL"],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 10,
  });

  const data = {
    activeVisitors: asNumber(response.totals?.[0]?.metricValues?.[0]?.value),
    pages: (response.rows ?? []).map((row) => ({
      path: dimension(row, 0) || "Unknown page",
      visitors: metric(row, 0),
    })),
  };

  realtimeCache = { data, expiresAt: Date.now() + REALTIME_CACHE_MS };
  return data;
};

export const getGoogleAnalyticsDashboard = async (period) => {
  getConfiguration();
  const [standard, realtime] = await Promise.all([
    getStandardReports(period),
    getRealtimeReport(),
  ]);

  return {
    ...standard,
    realtime,
    generatedAt: new Date().toISOString(),
  };
};
