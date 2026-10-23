import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { getSiteContent } from "@/db/store";
import "./globals.css";
import "./homepage.css";
import "./brand.css";
import "./public-pages.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin","vietnamese"], weight: ["400","500","600"], display: "swap", preload: true, adjustFontFallback: true });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin","vietnamese"], weight: ["400","500","600","700"], display: "swap", preload: true, adjustFontFallback: true });

export async function generateMetadata(): Promise<Metadata> {
  const base = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  const site = await getSiteContent();
  const title = site.brand.name === "THUYNGA Shop" ? "THUYNGA Shop — Hàng nhập khẩu chính hãng" : site.brand.name;
  const image = site.seo.image || site.brand.logo;
  return {
    metadataBase: base,
    title: { default: title, template: (site.seo.titleTemplate || "{tên trang} | THUYNGA Shop").replace("{tên trang}", "%s") },
    description: site.seo.description,
    openGraph: { title, description: site.seo.description, images: [{ url: new URL(image, base).toString(), width: 1080, height: 1080, alt: site.brand.name }] },
    twitter: { card: "summary_large_image", images: [new URL(image, base).toString()] },
    icons: site.brand.favicon ? { icon: [{ url: "/site-icon/32", sizes: "32x32", type: "image/png" }, { url: "/site-icon/64", sizes: "64x64", type: "image/png" }], apple: [{ url: "/site-icon/180", sizes: "180x180", type: "image/png" }] } : undefined,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><head><link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous"/></head><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
