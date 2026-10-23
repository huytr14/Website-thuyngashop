"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/catalog/products";
import CartDrawer from "@/components/storefront/CartDrawer";
import type { Product } from "@/components/storefront/types";
import { CART_STORAGE_KEY, cartLines, parseCart, storeCart } from "@/lib/cart";
import { visibleCategories, type ShopCategory } from "@/lib/categories";
import { pricedLine } from "@/lib/product-pricing";

export default function PublicMobileNav({ products, categories, flashSettings }: { products: Product[]; categories: ShopCategory[]; flashSettings: { flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null } }) {
  const [panel, setPanel] = useState<"categories" | "search" | "cart" | null>(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  useEffect(() => { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY))); }, []);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = cartLines(cart, products).reduce((sum, { product, variantName, quantity }) => sum + (pricedLine(product, variantName, flashSettings)?.price ?? product.price) * quantity, 0);
  const update = (key: string, delta: number) => setCart((current) => {
    const next = { ...current, [key]: Math.max(0, (current[key] ?? 0) + delta) };
    if (!next[key]) delete next[key];
    storeCart(next);
    return next;
  });
  return <>
    <nav className="mobile-bottom-nav" aria-label="Điều hướng mobile"><a href="/">Trang chủ</a><button type="button" aria-current={panel === "categories" ? "page" : undefined} onClick={() => setPanel(panel === "categories" ? null : "categories")}>Danh mục</button><button type="button" aria-current={panel === "search" ? "page" : undefined} onClick={() => setPanel(panel === "search" ? null : "search")}>Tìm kiếm</button><button type="button" onClick={() => setPanel("cart")}>Giỏ hàng {count > 0 && `(${count})`}</button><a href="/tai-khoan" aria-current={typeof location !== "undefined" && location.pathname === "/tai-khoan" ? "page" : undefined}>Tài khoản</a></nav>
    {panel === "categories" && <div className="public-mobile-panel"><button type="button" onClick={() => setPanel(null)} aria-label="Đóng danh mục">×</button><h2>Danh mục</h2>{visibleCategories(categories).filter(({ parentId }) => !parentId).map(({ id, slug, name }) => <a key={id} href={`/danh-muc/${slug}`}>{name}</a>)}</div>}
    {panel === "search" && <form className="public-mobile-panel" action="/"><button type="button" onClick={() => setPanel(null)} aria-label="Đóng tìm kiếm">×</button><label htmlFor="public-search">Tìm sản phẩm</label><input id="public-search" autoFocus name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên sản phẩm, thương hiệu..."/><button type="submit">Tìm kiếm</button></form>}
    <CartDrawer open={panel === "cart"} count={count} products={products} cart={cart} subtotal={subtotal} close={() => setPanel(null)} update={update} checkout={() => location.assign("/thanh-toan")} format={formatPrice} flashSettings={flashSettings}/>
  </>;
}
