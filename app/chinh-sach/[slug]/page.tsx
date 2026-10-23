import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicPage from "@/components/PublicPage";
import { getShopSettings } from "@/db/store";
import { pageMetadata } from "@/lib/site-metadata";

const policies = {
  "bao-mat": ["Chính sách bảo mật", "privacyPolicy"], "van-chuyen": ["Chính sách vận chuyển", "shippingPolicy"],
  "doi-tra": ["Chính sách đổi trả", "returnsPolicy"], "dieu-khoan": ["Điều khoản sử dụng", "termsPolicy"],
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const policy = policies[(await params).slug as keyof typeof policies]; return policy ? pageMetadata(policy[0]) : {}; }

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) { const policy = policies[(await params).slug as keyof typeof policies]; if (!policy) notFound(); const settings = await getShopSettings(); return <PublicPage><article className="content-article"><p className="eyebrow">THÔNG TIN CỬA HÀNG</p><h1>{policy[0]}</h1><div>{settings[policy[1]]}</div></article></PublicPage>; }
