import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import AdminSectionLayout from "@/app/admin/AdminSectionLayout";
import CategoryAdmin from "./CategoryAdmin";

export default async function CategoryPage() {
  if (!await hasAdminSession()) redirect("/admin");
  return <AdminSectionLayout title="Danh mục"><CategoryAdmin/></AdminSectionLayout>;
}
