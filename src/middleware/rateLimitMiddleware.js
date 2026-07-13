const requestBuckets = new Map();

export const createRateLimiter = ({ windowMs, max, message }) => (req, res, next) => {
  const now = Date.now();
  const key = `${req.ip}:${req.baseUrl}${req.path}`;
  const current = requestBuckets.get(key);

  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(max - 1));
    return next();
  }

  current.count += 1;
  res.set("RateLimit-Limit", String(max));
  res.set("RateLimit-Remaining", String(Math.max(0, max - current.count)));
  res.set("RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

  if (current.count > max) {
    res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ message });
  }

  return next();
};
