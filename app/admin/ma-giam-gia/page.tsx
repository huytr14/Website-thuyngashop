import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import AdminSectionLayout from "@/app/admin/AdminSectionLayout";
import VoucherAdmin from "./VoucherAdmin";

export default async function VouchersPage() {
  if (!await hasAdminSession()) redirect("/admin");
  return <AdminSectionLayout title="Mã giảm giá"><VoucherAdmin/></AdminSectionLayout>;
}
