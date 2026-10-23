"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/catalog/products";
import { formatPrice } from "@/catalog/products";
import type { ProductReview, ReviewSummary } from "@/db/store";
import { CART_STORAGE_KEY, parseCart, storeCart } from "@/lib/cart";
import CartDrawer from "@/components/storefront/CartDrawer";
import Footer from "@/components/storefront/Footer";
import Header from "@/components/storefront/Header";

type Props = { product: Product; products: Product[]; related: Product[]; reviews: ProductReview[]; summaries: Record<number, ReviewSummary> };

export default function ProductPageClient({ product, products, related, reviews, summaries }: Props) {
  const images = [...new Set([product.image, ...product.extraImages].filter(Boolean))];
  const [image, setImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY))); }, []);
  const richDescription = /^\s*</.test(product.description);
  const descriptionLines = richDescription ? [] : product.description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const usageLines = descriptionLines.filter((line) => /^(thành phần|cách dùng)\s*:/i.test(line));
  const benefitText = [product.shortDescription, ...descriptionLines.filter((line) => !usageLines.includes(line))].filter(Boolean).join("\n");
  const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const subtotal = products.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0);
  const update = (id: number, delta: number) => setCart((current) => { const next = { ...current, [id]: Math.max(0, Math.min(99, (current[id] || 0) + delta)) }; if (!next[id]) delete next[id]; storeCart(next); return next; });
  const add = (checkout = false) => {
    const next = { ...cart, [product.id]: Math.min(99, (cart[product.id] || 0) + quantity) };
    storeCart(next);
    setCart(next);
    if (checkout) location.assign("/thanh-toan"); else setCartOpen(true);
  };

  return <><Header menuOpen={menuOpen} searchOpen={searchOpen} query={query} count={count} setMenuOpen={setMenuOpen} setSearchOpen={setSearchOpen} setQuery={setQuery} setCategory={() => {}} openCart={() => setCartOpen(true)} browseFromProduct/><main className="public-page"><div className="product-page">
    <nav className="product-breadcrumb" aria-label="Đường dẫn"><a href="/">Trang chủ</a> / <a href="/#deals">Sản phẩm</a> / {product.name}</nav>
    <div className="product-page-top">
      <div className="product-gallery">
        <div className="product-gallery-main"><img src={image} alt={product.name}/></div>
        {images.length > 1 && <div className="product-gallery-thumbs" aria-label="Ảnh sản phẩm">{images.map((src, index) => <button type="button" key={src} className={image === src ? "selected" : ""} onClick={() => setImage(src)} aria-label={`Xem ảnh ${index + 1} của ${product.name}`} aria-pressed={image === src}><img src={src} alt="" loading="lazy"/></button>)}</div>}
      </div>
      <aside className="product-buy-panel">
        <p className="eyebrow">{product.brand}</p><h1>{product.name}</h1>
        {summaries[product.id]?.count > 0 && <p className="product-rating" aria-label={`${summaries[product.id].average} trên 5 sao, ${summaries[product.id].count} lượt đánh giá`}>★ {summaries[product.id].average.toLocaleString("vi-VN")} <span>({summaries[product.id].count} lượt đánh giá)</span></p>}
        <div className="detail-price"><strong>{formatPrice(product.price)}</strong>{product.oldPrice > product.price && <><del>{formatPrice(product.oldPrice)}</del><span>-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></>}</div>
        {product.variant && <div className="product-variant"><span>Biến thể</span><button type="button" className="selected" aria-pressed="true">{product.variant}</button></div>}
        <div className="detail-quantity"><span>Số lượng</span><div className="qty"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(99, quantity + 1))} aria-label="Tăng số lượng">+</button></div></div>
        <p className="stock-state">{product.inStock ? "● Còn hàng" : "● Hết hàng"}</p>
        <div className="detail-actions"><button type="button" className="add-detail" disabled={!product.inStock} onClick={() => add()}>THÊM VÀO TÚI</button><button type="button" className="buy-now" disabled={!product.inStock} onClick={() => add(true)}>MUA NGAY</button></div>
      </aside>
    </div>
    {(benefitText || richDescription) && <section className="product-page-section"><h2>Mô tả & lợi ích</h2>{product.shortDescription && richDescription && <p className="product-prose">{product.shortDescription}</p>}{richDescription ? <div className="product-prose" dangerouslySetInnerHTML={{ __html: product.description }}/> : <p className="product-prose">{benefitText}</p>}</section>}
    {usageLines.length > 0 && <section className="product-page-section"><h2>Thành phần & cách dùng</h2>{usageLines.map((line) => <p className="product-prose" key={line}>{line}</p>)}</section>}
    <section className="product-page-section"><h2>Thông số sản phẩm</h2><dl className="product-specs"><dt>Thương hiệu</dt><dd>{product.brand}</dd><dt>Danh mục</dt><dd>{product.category}</dd>{product.variant && <><dt>Biến thể</dt><dd>{product.variant}</dd></>}<dt>Mã sản phẩm</dt><dd>TNG-{String(product.id).padStart(3, "0")}</dd></dl></section>
    <section className="product-page-section"><h2>Đánh giá đã duyệt</h2>{reviews.length ? reviews.map((review) => <article className="product-review" key={review.id}><strong>{"★".repeat(review.rating)} · {review.title}</strong><p>{review.content}</p><small>{review.customerName ?? "Khách hàng"}</small></article>) : <p>Chưa có đánh giá được duyệt.</p>}</section>
    {related.length > 0 && <section className="product-page-section"><h2>Sản phẩm liên quan</h2><div className="related-products">{related.map((item) => <article key={item.id}><a href={`/san-pham/${item.slug}`}><div className="related-image"><img src={item.image} alt={item.name} loading="lazy"/></div><h3>{item.name}</h3></a>{summaries[item.id] && <p className="product-rating">★ {summaries[item.id].average.toLocaleString("vi-VN")} ({summaries[item.id].count})</p>}<strong>{formatPrice(item.price)}</strong></article>)}</div></section>}
  </div></main><Footer/><CartDrawer open={cartOpen} count={count} products={products} cart={cart} subtotal={subtotal} close={() => setCartOpen(false)} update={update} checkout={() => location.assign("/thanh-toan")} format={formatPrice}/></>;
}
