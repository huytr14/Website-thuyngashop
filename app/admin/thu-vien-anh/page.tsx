import { redirect } from "next/navigation";
import { hasAdminSession } from "@/app/admin-auth";
import AdminSectionLayout from "@/app/admin/AdminSectionLayout";
import MediaLibrary from "./MediaLibrary";

export default async function MediaPage() { if (!await hasAdminSession()) redirect("/admin"); return <AdminSectionLayout title="Thư viện ảnh"><MediaLibrary/></AdminSectionLayout>; }
