import { ArrowRight, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "./types";
import type { ReviewSummary } from "@/db/store";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { flashActive } from "@/lib/product-pricing";
import { useWishlist } from "@/lib/wishlist";
import { responsiveImage } from "@/lib/responsive-image";

type ProductGridProps = {
  categories: string[];
  category: string;
  sort: string;
  query: string;
  filtered: Product[];
  visibleProducts: Product[];
  showAllProducts: boolean;
  underMillion: boolean;
  setUnderMillion: (active: boolean) => void;
  setCategory: (category: string) => void;
  setSort: (sort: string) => void;
  setShowAllProducts: (show: boolean) => void;
  openProduct: (product: Product) => void;
  buyNow: (id: number) => void;
  add: (id: number) => void;
  format: (value: number) => string;
  reviewSummaries: Record<number, ReviewSummary>;
  section?: SiteContent["sections"]["deals"];
  flashSettings?: { flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null };
};

export function ProductCard({ product: p, summary, flashSettings = {}, format, liked, toggleLiked, buyNow, add, openProduct, showProgress = false }: { product: Product; summary?: ReviewSummary; flashSettings?: ProductGridProps["flashSettings"]; format: (value: number) => string; liked: boolean; toggleLiked: () => void; buyNow: () => void; add: () => void; openProduct: () => void; showProgress?: boolean }) {
  const flashing = flashActive(flashSettings) && p.flashPrice != null && (p.flashStock == null || p.flashStock > 0);
  const price = flashing ? p.flashPrice! : p.price;
  const oldPrice = flashing ? p.price : p.oldPrice;
  const badge = p.badge || (p.createdAt && Date.now() - new Date(p.createdAt).getTime() < 14 * 86400000 ? "Mới" : "");
  return <article className={`product${p.inStock ? "" : " out-of-stock"}`} id={`san-pham-${p.id}`}>
    <div className="product-image">
      <button type="button" className="card-wishlist" aria-label={liked ? `Bỏ yêu thích ${p.name}` : `Yêu thích ${p.name}`} aria-pressed={liked} onClick={toggleLiked}>{liked ? "♥" : "♡"}</button>
      {badge && <span className="product-badge">{badge}</span>}
      {oldPrice > price && <span className="discount">-{Math.round((1 - price / oldPrice) * 100)}%</span>}
      {!p.inStock && <span className="sold-out-badge">Hết hàng</span>}
      <a className="image-open" href={`/san-pham/${p.slug}`} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} {...responsiveImage(p.image, "(max-width: 767px) 50vw, 25vw")} alt={`${p.brand} ${p.name}`} width={480} height={480} loading="lazy"/></a>
      <button className="card-buy" disabled={!p.inStock} onClick={buyNow}><ShoppingBag size={13}/> MUA NGAY</button>
    </div>
    <p className="product-brand">{p.brand}</p>
    <h3><a className="product-link" href={`/san-pham/${p.slug}`}>{p.name}</a></h3>
    <div className="product-rating-slot">{summary && <p className="product-rating" aria-label={`${summary.average} trên 5 sao, ${summary.count} lượt đánh giá`}>★ {summary.average.toLocaleString("vi-VN")} <span>({summary.count})</span></p>}</div>
    <div className="price"><strong>{format(price)}</strong>{oldPrice > price && <del>{format(oldPrice)}</del>}</div>
    <div className="product-sold-slot">{!!p.soldCount && <small>Đã bán {p.soldCount >= 1000 ? `${(p.soldCount / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}k` : p.soldCount}</small>}</div>
    {showProgress && p.flashStock != null && <div className="flash-progress"><progress max={(p.soldCount ?? 0) + p.flashStock || 1} value={p.soldCount ?? 0}/><small>Đã bán {p.soldCount ?? 0}/{(p.soldCount ?? 0) + p.flashStock}</small></div>}
    <div className="product-card-actions"><button type="button" disabled={!p.inStock} onClick={add}>Thêm vào giỏ</button><button className="product-detail-link" onClick={openProduct}>Xem nhanh <ArrowUpRight size={13}/></button></div>
  </article>;
}

export default function ProductGrid({ categories, category, sort, query, filtered, visibleProducts, showAllProducts, underMillion, setUnderMillion, setCategory, setSort, setShowAllProducts, openProduct, buyNow, add, format, reviewSummaries, section = defaultSiteContent.sections.deals, flashSettings = {} }: ProductGridProps) {
  const wishlist = useWishlist();
  return <section className="products section product-first" id="deals">
    <div className="shop-heading">
      <div><span className="section-overline">01 / HÀNG NHẬP KHẨU CHỌN LỌC</span><h2>{section.title}</h2><p>{section.subtitle}</p></div>
    </div>
    <div className="catalog-toolbar">
      <Tabs value={category} onValueChange={setCategory}><TabsList className="catalog-tabs" aria-label="Danh mục sản phẩm">{categories.map((name) => <TabsTrigger key={name} value={name}>{name}</TabsTrigger>)}</TabsList></Tabs>
      <div className="catalog-quick-filters"><button type="button" aria-pressed={sort === "newest"} onClick={() => setSort(sort === "newest" ? "featured" : "newest")}>Mới nhất</button><button type="button" aria-pressed={underMillion} onClick={() => setUnderMillion(!underMillion)}>Dưới 1 triệu</button></div>
      <div className="catalog-sort"><span>{filtered.length} sản phẩm</span><label>Sắp xếp <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Nổi bật</option><option value="newest">Mới nhất</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label></div>
    </div>
    <div className="product-grid">
      {visibleProducts.map((p) => <ProductCard key={p.id} product={p} summary={reviewSummaries[p.id]} flashSettings={flashSettings} format={format} liked={wishlist.ids.includes(p.id)} toggleLiked={() => void wishlist.toggle(p.id)} buyNow={() => buyNow(p.id)} add={() => add(p.id)} openProduct={() => openProduct(p)}/>) }
    </div>
    {!filtered.length && <div className="empty-search">Không tìm thấy sản phẩm phù hợp.</div>}
    {!query && filtered.length > 12 && <button className="show-all" onClick={() => setShowAllProducts(!showAllProducts)}>{showAllProducts ? "THU GỌN" : `XEM TẤT CẢ ${filtered.length} SẢN PHẨM`} <ArrowRight size={15}/></button>}
    <p className="demo-note">Danh mục minh họa để duyệt giao diện. Tên, ảnh, giá và tồn kho cần đối chiếu với dữ liệu chính thức trước khi bán hàng.</p>
  </section>;
}
