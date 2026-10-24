import type { ZodError } from "zod";

export type FieldIssue = { path: string; message: string };

export function invalidFields(error: ZodError) {
  const issues = error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
  return Response.json({ error: issues[0]?.message ?? "Dữ liệu không hợp lệ", issues }, { status: 400 });
}

export function fieldIssue(path: string, message: string, status = 400) {
  return Response.json({ error: message, issues: [{ path, message }] }, { status });
}

export function splitIssues(data: { error?: string; issues?: FieldIssue[] }, fields: readonly string[]) {
  const known = new Set(fields);
  const at: Record<string, string> = {};
  const other: string[] = [];
  for (const issue of data.issues ?? []) {
    const path = known.has(issue.path) ? issue.path : issue.path.split(".")[0];
    if (known.has(path)) at[path] ??= issue.message;
    else other.push(issue.message);
  }
  return { at, other: other.join("; ") || (!data.issues?.length ? data.error ?? "Không thể lưu" : "") };
}
