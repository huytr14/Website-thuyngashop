import { clearAdminSession } from "@/app/admin-auth";

export async function POST(request: Request) {
  await clearAdminSession();
  return Response.redirect(new URL("/admin", request.url), 303);
}
