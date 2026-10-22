import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import { getShopSettings } from "@/db/store";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Liên hệ | THUYNGA Shop", description: "Liên hệ THUYNGA Shop để được tư vấn sản phẩm và đơn hàng.", openGraph: { title: "Liên hệ | THUYNGA Shop", description: "Liên hệ THUYNGA Shop để được tư vấn sản phẩm và đơn hàng." } };

export default async function ContactPage() { const settings = await getShopSettings(); return <PublicPage><div className="content-split"><article className="content-article"><p className="eyebrow">LIÊN HỆ</p><h1>Chúng tôi có thể giúp gì cho bạn?</h1><div>{settings.contactContent}</div></article><ContactForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}/></div></PublicPage>; }
