"use client";

import { useEffect, useState } from "react";
import { formatPrice, type Product } from "@/catalog/products";
import type { ShopCategory } from "@/lib/categories";
import type { SiteContent } from "@/lib/site-content";
import type { ReviewSummary } from "@/db/store";
import { CART_STORAGE_KEY, cartLines, parseCart, storeCart } from "@/lib/cart";
import { flashActive, pricedLine } from "@/lib/product-pricing";
import { useWishlist } from "@/lib/wishlist";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import CartDrawer from "@/components/storefront/CartDrawer";
import "./category.css";

export default function CategoryPageClient({ category, categoryTree, products, allProducts, site, summaries, flashSettings }: { category: ShopCategory; categoryTree: ShopCategory[]; products: Product[]; allProducts: Product[]; site: SiteContent; summaries: Record<number, ReviewSummary>; flashSettings: { flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null; freeShippingThreshold?: number } }) {
  const [brand, setBrand] = useState("");
  const [origin, setOrigin] = useState("");
  const [sort, setSort] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wishlist = useWishlist();
  useEffect(() => { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY))); }, []);
  const brands = [...new Set(products.map((item) => item.brand).filter(Boolean))].sort();
  const origins = [...new Set(products.map((item) => item.origin).filter((item): item is string => Boolean(item)))].sort();
  const price = (item: Product) => flashActive(flashSettings) && item.flashPrice != null ? item.flashPrice : item.variantRows?.length ? Math.min(...item.variantRows.map((row) => row.price)) : item.price;
  const filtered = products.filter((item) => (!brand || item.brand === brand) && (!origin || item.origin === origin) && (!inStockOnly || item.inStock)).sort((a, b) => sort === "price-asc" ? price(a) - price(b) : sort === "price-desc" ? price(b) - price(a) : sort === "rating" ? (summaries[b.id]?.average ?? 0) - (summaries[a.id]?.average ?? 0) : b.id - a.id);
  const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const subtotal = cartLines(cart, allProducts).reduce((sum, { product, variantName, quantity }) => sum + (pricedLine(product, variantName, flashSettings)?.price ?? product.price) * quantity, 0);
  const add = (id: number) => { const next = { ...cart, [id]: Math.min(99, (cart[id] || 0) + 1) }; setCart(next); storeCart(next); setCartOpen(true); };
  const update = (key: string, delta: number) => setCart((current) => { const next = { ...current, [key]: Math.max(0, (current[key] || 0) + delta) }; if (!next[key]) delete next[key]; storeCart(next); return next; });
  return <>
    <Header menuOpen={menuOpen} searchOpen={searchOpen} query={query} count={count} setMenuOpen={setMenuOpen} setSearchOpen={setSearchOpen} setQuery={setQuery} setCategory={() => {}} openCart={() => setCartOpen(true)} browseFromProduct site={site} categoryTree={categoryTree}/>
    <main className="category-page"><nav><a href="/">Trang chủ</a> / {category.name}</nav><h1>{category.name}</h1>{category.description && <p>{category.description}</p>}
      <div className="category-facets">
        <label>Thương hiệu<select aria-label="Lọc thương hiệu" value={brand} onChange={(event) => setBrand(event.target.value)}><option value="">Tất cả</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Xuất xứ<select aria-label="Lọc xuất xứ" value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="">Tất cả</option>{origins.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Sắp xếp<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Mới nhất</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option><option value="rating">Đánh giá cao nhất</option></select></label>
        <label><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)}/> Chỉ còn hàng</label>
        <span>Có {filtered.length} sản phẩm</span><button type="button" onClick={() => { setBrand(""); setOrigin(""); setSort("newest"); setInStockOnly(false); }}>Đặt lại bộ lọc</button>
      </div>
      <div className="category-products">{filtered.map((item) => <article className={item.inStock ? "" : "out-of-stock"} key={item.id}>
        <button type="button" className="card-wishlist" aria-label={wishlist.ids.includes(item.id) ? `Bỏ yêu thích ${item.name}` : `Yêu thích ${item.name}`} aria-pressed={wishlist.ids.includes(item.id)} onClick={() => void wishlist.toggle(item.id)}>{wishlist.ids.includes(item.id) ? "♥" : "♡"}</button>
        {(item.badge || (item.createdAt && Date.now() - new Date(item.createdAt).getTime() < 14 * 86400000)) && <span className="category-badge">{item.badge || "Mới"}</span>}{!item.inStock && <span className="sold-out-badge">Hết hàng</span>}
        <a href={`/san-pham/${item.slug}`}><img src={item.image} alt={`${item.brand} ${item.name}`} loading="lazy"/><small>{item.brand}</small><h2>{item.name}</h2></a>
        {summaries[item.id] && <small>★ {summaries[item.id].average.toLocaleString("vi-VN")} ({summaries[item.id].count})</small>}
        <strong>{item.variantRows?.length && !flashActive(flashSettings) ? "Từ " : ""}{formatPrice(price(item))}</strong>{(flashActive(flashSettings) && item.flashPrice != null ? item.price : item.oldPrice) > price(item) && <small className="category-discount">-{Math.round((1 - price(item) / (flashActive(flashSettings) && item.flashPrice != null ? item.price : item.oldPrice)) * 100)}%</small>}{!!item.soldCount && <small>Đã bán {item.soldCount.toLocaleString("vi-VN")}</small>}
        {item.variantRows?.length && item.inStock ? <a className="category-add" href={`/san-pham/${item.slug}`}>Chọn biến thể</a> : <button type="button" disabled={!item.inStock} onClick={() => add(item.id)}>{item.inStock ? "Thêm vào giỏ" : "Hết hàng"}</button>}
      </article>)}</div>{!filtered.length && <p>Chưa có sản phẩm phù hợp.</p>}
    </main>
    <Footer site={site}/><CartDrawer open={cartOpen} count={count} products={allProducts} cart={cart} subtotal={subtotal} close={() => setCartOpen(false)} update={update} checkout={() => location.assign("/thanh-toan")} format={formatPrice} flashSettings={flashSettings}/>
  </>;
}
