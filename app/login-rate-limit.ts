const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 5;

// shortcut: this limit is per server instance; replace it with Upstash before horizontal production scaling.
export function isLoginRateLimited(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (entry.resetAt <= now) { attempts.delete(key); return false; }
  return entry.count >= maxAttempts;
}

export function recordFailedLogin(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + windowMs });
  else entry.count++;
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}
