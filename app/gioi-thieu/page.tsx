import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import { getShopSettings } from "@/db/store";
import { pageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> { return pageMetadata("Giới thiệu", "Tìm hiểu câu chuyện và lựa chọn làm đẹp của THUYNGA Shop."); }

export default async function AboutPage() { const settings = await getShopSettings(); return <PublicPage><article className="content-article"><p className="eyebrow">VỀ THUYNGA SHOP</p><h1>Vẻ đẹp được chọn lọc</h1><div>{settings.aboutContent}</div></article></PublicPage>; }
