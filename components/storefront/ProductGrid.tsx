import { ArrowRight, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "./types";

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
};

export default function ProductGrid({ categories, category, sort, query, filtered, visibleProducts, showAllProducts, setCategory, setSort, setShowAllProducts, openProduct, buyNow, format }: ProductGridProps) {
  return <section className="products section product-first" id="deals">
    <div className="shop-heading">
      <div><span className="section-overline">01 / BỘ SƯU TẬP MỸ PHẨM</span><h2>KHÁM PHÁ SẢN PHẨM</h2><p>30 lựa chọn chăm sóc da, trang điểm và tóc — chọn món yêu thích, xem chi tiết và mua ngay.</p></div>
    </div>
    <div className="catalog-toolbar">
      <Tabs value={category} onValueChange={setCategory}><TabsList className="catalog-tabs" aria-label="Danh mục sản phẩm">{categories.map((name) => <TabsTrigger key={name} value={name}>{name}</TabsTrigger>)}</TabsList></Tabs>
      <div className="catalog-sort"><span>{filtered.length} sản phẩm</span><label>Sắp xếp <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label></div>
    </div>
    <div className="product-grid">
      {visibleProducts.map((p) => (
        <article className="product" id={`san-pham-${p.id}`} key={p.id}>
          <div className="product-image">
            {p.badge && <span className="product-badge">{p.badge}</span>}
            <span className="discount">-{Math.round((1 - p.price / p.oldPrice) * 100)}%</span>
            <button className="image-open" onClick={() => openProduct(p)} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} loading="lazy" /></button>
            <button className="card-buy" onClick={() => buyNow(p.id)}><ShoppingBag size={13}/> MUA NGAY</button>
          </div>
          <p className="product-brand">{p.brand}</p>
          <h3><button className="product-link" onClick={() => openProduct(p)}>{p.name}</button></h3>
          <div className="price"><strong>{format(p.price)}</strong><del>{format(p.oldPrice)}</del></div>
          <button className="product-detail-link" onClick={() => openProduct(p)}>Xem chi tiết <ArrowUpRight size={13}/></button>
        </article>
      ))}
    </div>
    {!filtered.length && <div className="empty-search">Không tìm thấy sản phẩm phù hợp.</div>}
    {!query && filtered.length > 12 && <button className="show-all" onClick={() => setShowAllProducts(!showAllProducts)}>{showAllProducts ? "THU GỌN" : `XEM TẤT CẢ ${filtered.length} SẢN PHẨM`} <ArrowRight size={15}/></button>}
    <p className="demo-note">Danh mục minh họa để duyệt giao diện. Tên, ảnh, giá và tồn kho cần đối chiếu với dữ liệu chính thức trước khi bán hàng.</p>
  </section>;
}
