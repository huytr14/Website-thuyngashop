import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import { getShopSettings } from "@/db/store";

export const metadata: Metadata = { title: "Giới thiệu | THUYNGA Shop", description: "Tìm hiểu câu chuyện và lựa chọn làm đẹp của THUYNGA Shop.", openGraph: { title: "Giới thiệu | THUYNGA Shop", description: "Tìm hiểu câu chuyện và lựa chọn làm đẹp của THUYNGA Shop." } };

export default async function AboutPage() { const settings = await getShopSettings(); return <PublicPage><article className="content-article"><p className="eyebrow">VỀ THUYNGA SHOP</p><h1>Vẻ đẹp được chọn lọc</h1><div>{settings.aboutContent}</div></article></PublicPage>; }
