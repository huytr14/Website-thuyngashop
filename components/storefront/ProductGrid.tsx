import { ArrowRight, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "./types";
import type { ReviewSummary } from "@/db/store";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { flashActive } from "@/lib/product-pricing";
import { useWishlist } from "@/lib/wishlist";

type ProductGridProps = {
  categories: string[];
  category: string;
  sort: string;
  query: string;
  filtered: Product[];
  visibleProducts: Product[];
  showAllProducts: boolean;
  setCategory: (category: string) => void;
  setSort: (sort: string) => void;
  setShowAllProducts: (show: boolean) => void;
  openProduct: (product: Product) => void;
  buyNow: (id: number) => void;
  format: (value: number) => string;
  reviewSummaries: Record<number, ReviewSummary>;
  section?: SiteContent["sections"]["deals"];
  flashSettings?: { flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null };
};

export default function ProductGrid({ categories, category, sort, query, filtered, visibleProducts, showAllProducts, setCategory, setSort, setShowAllProducts, openProduct, buyNow, format, reviewSummaries, section = defaultSiteContent.sections.deals, flashSettings = {} }: ProductGridProps) {
  const wishlist = useWishlist();
  return <section className="products section product-first" id="deals">
    <div className="shop-heading">
      <div><span className="section-overline">01 / HÀNG NHẬP KHẨU CHỌN LỌC</span><h2>{section.title}</h2><p>{section.subtitle}</p></div>
    </div>
    <div className="catalog-toolbar">
      <Tabs value={category} onValueChange={setCategory}><TabsList className="catalog-tabs" aria-label="Danh mục sản phẩm">{categories.map((name) => <TabsTrigger key={name} value={name}>{name}</TabsTrigger>)}</TabsList></Tabs>
      <div className="catalog-sort"><span>{filtered.length} sản phẩm</span><label>Sắp xếp <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label></div>
    </div>
    <div className="product-grid">
      {visibleProducts.map((p) => { const flashing = flashActive(flashSettings) && p.flashPrice != null; const price = flashing ? p.flashPrice! : p.price; const oldPrice = flashing ? p.price : p.oldPrice; return (
        <article className="product" id={`san-pham-${p.id}`} key={p.id}>
          <div className="product-image">
            <button type="button" className="card-wishlist" aria-label={wishlist.ids.includes(p.id) ? `Bỏ yêu thích ${p.name}` : `Yêu thích ${p.name}`} aria-pressed={wishlist.ids.includes(p.id)} onClick={() => void wishlist.toggle(p.id)}>{wishlist.ids.includes(p.id) ? "♥" : "♡"}</button>
            {p.badge && <span className="product-badge">{p.badge}</span>}
            {oldPrice > price && <span className="discount">-{Math.round((1 - price / oldPrice) * 100)}%</span>}
            <a className="image-open" href={`/san-pham/${p.slug}`} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} loading="lazy" /></a>
            <button className="card-buy" onClick={() => buyNow(p.id)}><ShoppingBag size={13}/> MUA NGAY</button>
          </div>
          <p className="product-brand">{p.brand}</p>
          <h3><a className="product-link" href={`/san-pham/${p.slug}`}>{p.name}</a></h3>
          {reviewSummaries[p.id] && <p className="product-rating" aria-label={`${reviewSummaries[p.id].average} trên 5 sao, ${reviewSummaries[p.id].count} lượt đánh giá`}>★ {reviewSummaries[p.id].average.toLocaleString("vi-VN")} <span>({reviewSummaries[p.id].count})</span></p>}
          <div className="price"><strong>{format(price)}</strong>{oldPrice > price && <del>{format(oldPrice)}</del>}</div>
          {!!p.soldCount && <small>Đã bán {p.soldCount >= 1000 ? `${(p.soldCount / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}k` : p.soldCount}</small>}
          <button className="product-detail-link" onClick={() => openProduct(p)}>Xem nhanh <ArrowUpRight size={13}/></button>
        </article>
      ); })}
    </div>
    {!filtered.length && <div className="empty-search">Không tìm thấy sản phẩm phù hợp.</div>}
    {!query && filtered.length > 12 && <button className="show-all" onClick={() => setShowAllProducts(!showAllProducts)}>{showAllProducts ? "THU GỌN" : `XEM TẤT CẢ ${filtered.length} SẢN PHẨM`} <ArrowRight size={15}/></button>}
    <p className="demo-note">Danh mục minh họa để duyệt giao diện. Tên, ảnh, giá và tồn kho cần đối chiếu với dữ liệu chính thức trước khi bán hàng.</p>
  </section>;
}
