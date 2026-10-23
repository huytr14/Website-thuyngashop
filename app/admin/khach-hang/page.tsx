import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import AdminSectionLayout from "@/app/admin/AdminSectionLayout";
import CustomerAdmin from "./CustomerAdmin";

export default async function CustomersPage() {
  if (!await hasAdminSession()) redirect("/admin");
  return <AdminSectionLayout title="Khách hàng"><CustomerAdmin/></AdminSectionLayout>;
}
