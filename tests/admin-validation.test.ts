import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { invalidFields, splitIssues } from "../lib/admin-validation.ts";

test("Zod giữ path từng field và chỉ lỗi không gắn được mới lên banner", async () => {
  const parsed = z.object({ price: z.number().positive(), oldPrice: z.number().positive() }).safeParse({ price: 0, oldPrice: 0 });
  assert.equal(parsed.success, false);
  if (parsed.success) return;
  const response = invalidFields(parsed.error);
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.deepEqual(data.issues.map((issue: { path: string }) => issue.path), ["price", "oldPrice"]);
  assert.deepEqual(splitIssues(data, ["oldPrice"]), { at: { oldPrice: data.issues[1].message }, other: data.issues[0].message });
});
