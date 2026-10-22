import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

type HeroProps = {
  heroIndex: number;
  setHeroIndex: (index: number) => void;
};

export default function Hero({ heroIndex, setHeroIndex }: HeroProps) {
  return <section className={`hero hero-slide-${heroIndex}`} aria-label="Bộ sưu tập nổi bật">
    <div className="hero-copy">
      <p className="eyebrow">THUYNGA BEAUTY SELECTION</p>
      <h1>{heroIndex === 0 ? <>SẮC ĐỎ<br/><em>VƯỢT THỜI GIAN</em></> : <>CHẠM VÀO<br/><em>VẺ ĐẸP RIÊNG</em></>}</h1>
      <p>{heroIndex === 0 ? "Một điểm nhấn khó quên trong bộ sưu tập chăm sóc da được tuyển chọn." : "Tuyển chọn mỹ phẩm cho nhịp sống hiện đại — đơn giản, tinh tế và đầy cảm hứng."}</p>
      <a href="#deals" className="primary">KHÁM PHÁ SẢN PHẨM <ArrowUpRight size={16}/></a>
      <span className="hero-number">0{heroIndex + 1} <i/> 02</span>
    </div>
    <div className="hero-image"><img src={heroIndex === 0 ? "/shiseido-eudermine-reference.png" : "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85"} alt={heroIndex === 0 ? "Shiseido Eudermine" : "Bộ sưu tập mỹ phẩm"}/><span className="hero-image-label">{heroIndex === 0 ? "SHISEIDO · EUDERMINE" : "THUYNGA BEAUTY EDIT"}</span></div>
    <div className="hero-controls"><button className="hero-arrow hero-prev" onClick={() => setHeroIndex((heroIndex + 1) % 2)} aria-label="Banner trước"><ChevronLeft size={21}/></button>
    <div className="hero-dots"><button className={heroIndex === 0 ? "active" : ""} onClick={() => setHeroIndex(0)} aria-label="Banner 1"/><button className={heroIndex === 1 ? "active" : ""} onClick={() => setHeroIndex(1)} aria-label="Banner 2"/></div>
    <button className="hero-arrow hero-next" onClick={() => setHeroIndex((heroIndex + 1) % 2)} aria-label="Banner tiếp theo"><ChevronRight size={21}/></button></div>
  </section>;
}
