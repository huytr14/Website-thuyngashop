import "./editor.css";
import { getSiteContent } from "@/db/store";
import AdminChrome from "@/components/admin/AdminChrome";

export default async function AdminSectionLayout({ title, children }: { title: string; children: React.ReactNode }) { const site = await getSiteContent(); return <AdminChrome title={title} brand={site.brand}>{children}</AdminChrome>; }
