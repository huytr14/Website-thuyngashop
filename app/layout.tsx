import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400","500","600"] });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin","vietnamese"], weight: ["400","500","600","700"] });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "OLALA SELECT — Vẻ đẹp được chọn lọc",
    description: "Mỹ phẩm cao cấp chính hãng, tuyển chọn dành cho người phụ nữ hiện đại.",
    openGraph: {
      title: "OLALA SELECT — Vẻ đẹp được chọn lọc",
      description: "Mỹ phẩm cao cấp chính hãng, tuyển chọn dành cho người phụ nữ hiện đại.",
      images: [{ url: new URL("/og.png", base).toString(), width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [new URL("/og.png", base).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
