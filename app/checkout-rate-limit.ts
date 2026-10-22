const requests = new Map<string, { count: number; resetAt: number }>();

// shortcut: this limit is per server instance; replace it with Upstash before horizontal production scaling.
export function checkoutRateLimited(key: string, now = Date.now()) {
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count++;
  return current.count > 10;
}

export function requestClient(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
