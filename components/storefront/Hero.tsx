import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { responsiveImage } from "@/lib/responsive-image";

type HeroProps = {
  heroIndex: number;
  setHeroIndex: (index: number) => void;
  slides?: SiteContent["hero"];
};

export default function Hero({ heroIndex, setHeroIndex, slides = defaultSiteContent.hero }: HeroProps) {
  const visible = slides.filter((slide) => slide.enabled);
  if (!visible.length) return null;
  const index = heroIndex % visible.length;
  const slide = visible[index];
  return <section className={`hero hero-slide-${index}`} aria-label="Bộ sưu tập nổi bật">
    <div className="hero-copy">
      <p className="eyebrow">THUYNGA SHOP · HÀNG NHẬP KHẨU</p>
      <h1>{slide.title}<br/><em>{slide.accent}</em></h1>
      <p>{slide.description}</p>
      {slide.buttonText && <a href={slide.buttonLink || "#deals"} className="primary">{slide.buttonText} <ArrowUpRight size={16}/></a>}
      <span className="hero-number">0{index + 1} <i/> {String(visible.length).padStart(2, "0")}</span>
    </div>
    <div className="hero-image"><img src={slide.image || defaultSiteContent.hero[0].image} {...responsiveImage(slide.image || defaultSiteContent.hero[0].image, "(max-width: 767px) 100vw, 55vw")} alt={slide.imageLabel || slide.title} width={1200} height={800} loading="eager" fetchPriority="high"/><span className="hero-image-label">{slide.imageLabel}</span></div>
    <div className="hero-controls"><button className="hero-arrow hero-prev" onClick={() => setHeroIndex((index - 1 + visible.length) % visible.length)} aria-label="Banner trước"><ChevronLeft size={21}/></button>
    <div className="hero-dots">{visible.map((item, dot) => <button key={item.id} className={index === dot ? "active" : ""} onClick={() => setHeroIndex(dot)} aria-label={`Banner ${dot + 1}`}/>)}</div>
    <button className="hero-arrow hero-next" onClick={() => setHeroIndex((index + 1) % visible.length)} aria-label="Banner tiếp theo"><ChevronRight size={21}/></button></div>
  </section>;
}
