import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import AdminSectionLayout from "@/app/admin/AdminSectionLayout";
import ReviewAdmin from "./ReviewAdmin";

export default async function AdminReviewsPage() { if (!await hasAdminSession()) redirect("/admin"); return <AdminSectionLayout title="Đánh giá"><ReviewAdmin/></AdminSectionLayout>; }
