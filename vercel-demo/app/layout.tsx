import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import "./homepage.css";
import "./brand.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600"] });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "THUYNGA Shop — Vẻ đẹp được chọn lọc",
  description: "Bản demo cửa hàng mỹ phẩm cao cấp THUYNGA Shop.",
  openGraph: { title: "THUYNGA Shop — Vẻ đẹp được chọn lọc", description: "Mỹ phẩm cao cấp chính hãng, tuyển chọn cho người phụ nữ hiện đại.", images: ["/thuynga-logo.png"] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
