import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import AdminSectionLayout from "@/app/admin/AdminSectionLayout";
import BlogAdmin from "./BlogAdmin";

export default async function AdminBlogPage() { if (!await hasAdminSession()) redirect("/admin"); return <AdminSectionLayout title="Tin tức"><BlogAdmin/></AdminSectionLayout>; }
