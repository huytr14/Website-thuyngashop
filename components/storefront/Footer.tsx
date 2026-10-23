import { defaultSiteContent, type SiteContent } from "@/lib/site-content";

export default function Footer({ site = defaultSiteContent }: { site?: SiteContent }) {
  const social = (["facebook", "instagram", "zalo", "tiktok", "youtube"] as const).filter((key) => site.footer[key]);
  return <>
    <footer id="about">
      <div className="footer-brand"><a href="/" className="logo brand-logo" aria-label={site.brand.name}><img src={site.brand.footerLogo || site.brand.logo || defaultSiteContent.brand.logo} alt={site.brand.name}/></a><p>{site.footer.intro}</p>{site.footer.address && <p>{site.footer.address}</p>}{site.footer.hotline && <p>{site.footer.hotline}</p>}{site.footer.email && <p>{site.footer.email}</p>}{site.footer.hours && <p>{site.footer.hours}</p>}</div>
      <div><h4>KHÁM PHÁ</h4><a href="/#deals">Sản phẩm mới</a><a href="/tin-tuc">Tin tức</a><a href="/gioi-thieu">Giới thiệu</a></div>
      <div><h4>HỖ TRỢ</h4><a href="/lien-he">Liên hệ</a><a href="/chinh-sach/van-chuyen">Vận chuyển</a><a href="/chinh-sach/doi-tra">Đổi trả</a><a href="/chinh-sach/bao-mat">Bảo mật</a></div>
      <div className="newsletter"><h4>{site.footer.newsletterTitle}</h4><p>{site.footer.newsletterIntro}</p><small>{site.footer.newsletterNote}</small></div>
    </footer>
    <div className="copyright">© 2026 {site.brand.name.toUpperCase()} {social.length > 0 && <span>{social.map((key, index) => <span key={key}>{index > 0 && " · "}<a href={site.footer[key]} rel="noopener noreferrer" target="_blank">{key[0].toUpperCase() + key.slice(1)}</a></span>)}</span>}</div>
  </>;
}
