type RateLimitEntry = { count: number; resetAt: number };

const globalRateLimit = globalThis as typeof globalThis & {
  carbonRateLimits?: Map<string, Map<string, RateLimitEntry>>;
};

function storeFor(scope: string) {
  const root =
    globalRateLimit.carbonRateLimits ?? new Map<string, Map<string, RateLimitEntry>>();
  globalRateLimit.carbonRateLimits = root;
  const scoped = root.get(scope) ?? new Map<string, RateLimitEntry>();
  root.set(scope, scoped);
  return scoped;
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}

export function isRateLimited(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const store = storeFor(scope);
  const current = store.get(identifier);
  if (!current || current.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export function retryAfterSeconds(windowMs: number) {
  return Math.ceil(windowMs / 1_000);
}
