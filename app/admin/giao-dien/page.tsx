import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import AdminSectionLayout from "@/app/admin/AdminSectionLayout";
import SiteEditor from "./SiteEditor";

export default async function SitePage() {
  if (!await hasAdminSession()) redirect("/admin");
  return <AdminSectionLayout title="Giao diện & Nội dung"><SiteEditor/></AdminSectionLayout>;
}
