import Footer from "@/components/storefront/Footer";

export default function PublicPage({ children }: { children: React.ReactNode }) {
  return <><header className="public-header"><a href="/" className="brand-logo"><img src="/thuynga-logo-wine.png" alt="THUYNGA Shop"/></a><nav><a href="/gioi-thieu">Giới thiệu</a><a href="/tin-tuc">Tin tức</a><a href="/lien-he">Liên hệ</a><a href="/tai-khoan">Tài khoản</a></nav></header><main className="public-page">{children}</main><Footer/></>;
}
