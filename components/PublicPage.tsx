import Footer from "@/components/storefront/Footer";
import { getSiteContent } from "@/db/store";

export default async function PublicPage({ children }: { children: React.ReactNode }) {
  const site = await getSiteContent();
  return <><header className="public-header"><a href="/" className="brand-logo"><img src={site.brand.logo} alt={site.brand.name}/></a><nav><a href="/gioi-thieu">Giới thiệu</a><a href="/tin-tuc">Tin tức</a><a href="/lien-he">Liên hệ</a><a href="/tai-khoan">Tài khoản</a></nav></header><main className="public-page">{children}</main><Footer site={site}/></>;
}
