const rateLimitMap = new Map<
  string,
  { count: number; lastReset: number }
>();

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now - record.lastReset > config.windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return { success: true, remaining: config.maxRequests - 1 };
  }

  if (record.count >= config.maxRequests) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: config.maxRequests - record.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
