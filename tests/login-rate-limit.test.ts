import assert from "node:assert/strict";
import test from "node:test";
import { clearLoginAttempts, isLoginRateLimited, recordFailedLogin } from "../app/login-rate-limit.ts";

test("blocks five failed logins and resets after the window", () => {
  const key = "test-client";
  clearLoginAttempts(key);
  for (let attempt = 0; attempt < 5; attempt++) recordFailedLogin(key, 1000);
  assert.equal(isLoginRateLimited(key, 1001), true);
  assert.equal(isLoginRateLimited(key, 16 * 60 * 1000), false);
});
