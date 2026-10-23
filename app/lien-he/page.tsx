import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import { getSiteContent } from "@/db/store";
import { pageMetadata } from "@/lib/site-metadata";
import ContactForm from "./ContactForm";

export async function generateMetadata(): Promise<Metadata> { return pageMetadata("Liên hệ", "Liên hệ THUYNGA Shop để được tư vấn sản phẩm và đơn hàng."); }

export default async function ContactPage() { const site = await getSiteContent(); return <PublicPage><div className="content-split"><article className="content-article"><p className="eyebrow">LIÊN HỆ</p><h1>Chúng tôi có thể giúp gì cho bạn?</h1><div>{site.footer.contactContent}</div>{site.footer.address && <p>Địa chỉ: {site.footer.address}</p>}{site.footer.hotline && <p>Hotline: {site.footer.hotline}</p>}{site.footer.email && <p>Email: {site.footer.email}</p>}{site.footer.hours && <p>Giờ mở cửa: {site.footer.hours}</p>}</article><ContactForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}/></div></PublicPage>; }
