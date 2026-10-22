import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import "./homepage.css";
import "./brand.css";
import "./public-pages.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400","500","600"] });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin","vietnamese"], weight: ["400","500","600","700"] });

export function generateMetadata(): Metadata {
  const base = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  return {
    metadataBase: base,
    title: "THUYNGA Shop — Vẻ đẹp được chọn lọc",
    description: "Mỹ phẩm cao cấp chính hãng, tuyển chọn dành cho người phụ nữ hiện đại.",
    openGraph: { title: "THUYNGA Shop — Vẻ đẹp được chọn lọc", description: "Mỹ phẩm cao cấp chính hãng, tuyển chọn dành cho người phụ nữ hiện đại.", images: [{ url: new URL("/thuynga-logo-wine.png", base).toString(), width: 1080, height: 1080, alt: "THUYNGA Shop" }] },
    twitter: { card: "summary_large_image", images: [new URL("/thuynga-logo-wine.png", base).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
