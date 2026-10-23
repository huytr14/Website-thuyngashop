"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/catalog/products";
import { formatPrice } from "@/catalog/products";
import type { ShopCategory } from "@/lib/categories";
import type { SiteContent } from "@/lib/site-content";
import { CART_STORAGE_KEY, parseCart, storeCart } from "@/lib/cart";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import CartDrawer from "@/components/storefront/CartDrawer";
import "./category.css";

export default function CategoryPageClient({ category, categoryTree, products, allProducts, site }: { category: ShopCategory; categoryTree: ShopCategory[]; products: Product[]; allProducts: Product[]; site: SiteContent }) {
  const [brand, setBrand] = useState("");
  const [origin, setOrigin] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY))); }, []);
  const brands = [...new Set(products.map((item) => item.brand).filter(Boolean))].sort();
  const origins = [...new Set(products.map((item) => item.origin).filter((item): item is string => Boolean(item)))].sort();
  const filtered = products.filter((item) => (!brand || item.brand === brand) && (!origin || item.origin === origin));
  const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const add = (id: number) => { const next = { ...cart, [id]: Math.min(99, (cart[id] || 0) + 1) }; setCart(next); storeCart(next); setCartOpen(true); };
  const update = (id: number, delta: number) => setCart((current) => { const next = { ...current, [id]: Math.max(0, (current[id] || 0) + delta) }; if (!next[id]) delete next[id]; storeCart(next); return next; });
  return <><Header menuOpen={menuOpen} searchOpen={searchOpen} query={query} count={count} setMenuOpen={setMenuOpen} setSearchOpen={setSearchOpen} setQuery={setQuery} setCategory={() => {}} openCart={() => setCartOpen(true)} browseFromProduct site={site} categoryTree={categoryTree}/><main className="category-page"><nav><a href="/">Trang chủ</a> / {category.name}</nav><h1>{category.name}</h1>{category.description && <p>{category.description}</p>}<div className="category-facets"><label>Thương hiệu<select aria-label="Lọc thương hiệu" value={brand} onChange={(event) => setBrand(event.target.value)}><option value="">Tất cả</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label><label>Xuất xứ<select aria-label="Lọc xuất xứ" value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="">Tất cả</option>{origins.map((item) => <option key={item}>{item}</option>)}</select></label><span>{filtered.length} sản phẩm</span></div><div className="category-products">{filtered.map((item) => <article key={item.id}><a href={`/san-pham/${item.slug}`}><img src={item.image} alt={item.name} loading="lazy"/><small>{item.brand}</small><h2>{item.name}</h2></a><strong>{formatPrice(item.price)}</strong><button type="button" disabled={!item.inStock} onClick={() => add(item.id)}>{item.inStock ? "Thêm vào giỏ" : "Hết hàng"}</button></article>)}</div>{!filtered.length && <p>Chưa có sản phẩm phù hợp.</p>}</main><Footer site={site}/><CartDrawer open={cartOpen} count={count} products={allProducts} cart={cart} subtotal={allProducts.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0)} close={() => setCartOpen(false)} update={update} checkout={() => location.assign("/thanh-toan")} format={formatPrice}/></>;
}
