"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/catalog/products";
import { formatPrice } from "@/catalog/products";
import type { ProductReview, ReviewSummary } from "@/db/store";
import { CART_STORAGE_KEY, cartKey, cartLines, parseCart, storeCart } from "@/lib/cart";
import { flashActive, pricedLine } from "@/lib/product-pricing";
import { useWishlist } from "@/lib/wishlist";
import { BadgeCheck, CalendarDays, MapPin, Package } from "lucide-react";
import CartDrawer from "@/components/storefront/CartDrawer";
import Footer from "@/components/storefront/Footer";
import Header from "@/components/storefront/Header";
import type { SiteContent } from "@/lib/site-content";
import { requiresDisclaimer, type ShopCategory } from "@/lib/categories";

type Props = { product: Product; products: Product[]; categoryTree: ShopCategory[]; related: Product[]; reviews: ProductReview[]; summaries: Record<number, ReviewSummary>; site: SiteContent; settings: { flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null; freeShippingThreshold?: number }; vouchers: { code: string; type: string; value: number; minOrder: number; expiresAt: Date | string | null }[] };

export default function ProductPageClient({ product, products, categoryTree, related, reviews, summaries, site, settings, vouchers }: Props) {
  const images = useMemo(() => [...new Set([product.image, ...product.extraImages, ...(product.variantRows?.map((row) => row.image) ?? [])].filter((src): src is string => !!src))], [product]);
  const [image, setImage] = useState(images[0]);
  const [lightbox, setLightbox] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [copyMessage, setCopyMessage] = useState("");
  const [sticky, setSticky] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const wishlist = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY))); }, []);
  useEffect(() => { const node = panel.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => setSticky(!entry.isIntersecting && entry.boundingClientRect.bottom < 0)); observer.observe(node); return () => observer.disconnect(); }, []);
  useEffect(() => { if (!lightbox) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape") setLightbox(false); if (event.key === "ArrowRight" || event.key === "ArrowLeft") setImage((current) => images[(images.indexOf(current) + images.length + (event.key === "ArrowRight" ? 1 : -1)) % images.length]); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [lightbox, images]);
  const options = product.variantOptions?.length ? product.variantOptions : product.variant ? [{ name: "Loại", values: [product.variant] }] : [];
  const variantName = chosen.length === options.length && chosen.every(Boolean) ? chosen.join(" / ") : undefined;
  const line = pricedLine(product, variantName, settings);
  useEffect(() => { if (line?.image) setImage(line.image); }, [line?.image]);
  const startingPrice = product.variantRows?.length ? Math.min(...product.variantRows.map((row) => row.price)) : product.price;
  const displayPrice = line?.price ?? (flashActive(settings) && product.flashPrice != null ? product.flashPrice : startingPrice);
  const comparisonPrice = flashActive(settings) && product.flashPrice != null ? product.price : product.oldPrice;
  const available = !!line?.inStock && (!options.length || !!variantName || !product.variantRows?.length);
  const mainImage = image;
  const richDescription = /^\s*</.test(product.description);
  const descriptionLines = richDescription ? [] : product.description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const usageLines = descriptionLines.filter((line) => /^(thành phần|cách dùng)\s*:/i.test(line));
  const benefitText = [product.shortDescription, ...descriptionLines.filter((line) => !usageLines.includes(line))].filter(Boolean).join("\n");
  const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const subtotal = cartLines(cart, products).reduce((sum, { product: item, variantName: variant, quantity: amount }) => sum + (pricedLine(item, variant, settings)?.price ?? item.price) * amount, 0);
  const update = (id: string, delta: number) => setCart((current) => { const next = { ...current, [id]: Math.max(0, Math.min(99, (current[id] || 0) + delta)) }; if (!next[id]) delete next[id]; storeCart(next); return next; });
  const add = (checkout = false) => {
    if (!available) return;
    const key = cartKey(product.id, product.variantRows?.length ? variantName : product.variant || undefined);
    const next = { ...cart, [key]: Math.min(99, (cart[key] || 0) + quantity) };
    storeCart(next);
    setCart(next);
    if (checkout) location.assign("/thanh-toan"); else setCartOpen(true);
  };
  const copyVoucher = async (code: string) => { try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code); else throw new Error("Clipboard unavailable"); } catch { const field = document.createElement("textarea"); field.value = code; document.body.append(field); field.select(); const copied = document.execCommand("copy"); field.remove(); if (!copied) return setCopyMessage("Không thể sao chép mã; vui lòng chọn và sao chép thủ công."); } setCopyMessage(`Đã sao chép mã ${code}`); };

  return <><Header menuOpen={menuOpen} searchOpen={searchOpen} query={query} count={count} setMenuOpen={setMenuOpen} setSearchOpen={setSearchOpen} setQuery={setQuery} setCategory={() => {}} openCart={() => setCartOpen(true)} browseFromProduct site={site} categoryTree={categoryTree}/><main className="public-page"><div className="product-page">
    <nav className="product-breadcrumb" aria-label="Đường dẫn"><a href="/">Trang chủ</a> / <a href="/#deals">Sản phẩm</a> / {product.name}</nav>
    <div className="product-page-top">
      <div className="product-gallery">
        <button type="button" className="product-gallery-main" onClick={() => setLightbox(true)} aria-label="Xem ảnh toàn màn hình"><img src={mainImage} alt={`${product.brand} ${product.name}`}/></button>
        {images.length > 1 && <div className="product-gallery-thumbs" aria-label="Ảnh sản phẩm">{images.map((src, index) => <button type="button" key={src} className={image === src ? "selected" : ""} onClick={() => setImage(src)} aria-label={`Xem ảnh ${index + 1} của ${product.name}`} aria-pressed={image === src}><img src={src} alt="" loading="lazy"/></button>)}</div>}
      </div>
      <aside className="product-buy-panel" ref={panel}>
        <p className="eyebrow">{product.brand}</p><h1>{product.name}</h1><div className="pdp-meta"><span><BadgeCheck size={15}/>{product.brand}</span>{product.origin && <span><MapPin size={15}/>{product.origin}</span>}{product.specification && <span><Package size={15}/>{product.specification}</span>}{product.expiryDate && <span><CalendarDays size={15}/>HSD {new Date(`${product.expiryDate}T00:00:00Z`).toLocaleDateString("vi-VN", { timeZone: "UTC" })}</span>}</div><button type="button" className="wishlist-button" aria-label={wishlist.ids.includes(product.id) ? "Bỏ yêu thích" : "Yêu thích"} aria-pressed={wishlist.ids.includes(product.id)} onClick={() => void wishlist.toggle(product.id)}>{wishlist.ids.includes(product.id) ? "♥" : "♡"} Yêu thích</button>
        {summaries[product.id]?.count > 0 && <p className="product-rating" aria-label={`${summaries[product.id].average} trên 5 sao, ${summaries[product.id].count} lượt đánh giá`}>★ {summaries[product.id].average.toLocaleString("vi-VN")} <span>({summaries[product.id].count} lượt đánh giá)</span></p>}
        <div className="detail-price"><strong>{!line && product.variantRows?.length ? `Từ ${formatPrice(displayPrice)}` : formatPrice(displayPrice)}</strong>{comparisonPrice > displayPrice && <><del>{formatPrice(comparisonPrice)}</del><span>-{Math.round((1 - displayPrice / comparisonPrice) * 100)}%</span></>}</div>
        {options.map((option, index) => <div className="product-variant" key={option.name}><span>{option.name}</span>{option.values.map((value) => <button type="button" key={value} className={chosen[index] === value ? "selected" : ""} aria-pressed={chosen[index] === value} onClick={() => setChosen((current) => options.map((_, i) => i === index ? value : current[i] ?? ""))}>{value}</button>)}</div>)}
        <div className="detail-quantity"><span>Số lượng</span><div className="qty"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(99, quantity + 1))} aria-label="Tăng số lượng">+</button></div></div>
        <p className="stock-state">{!line && options.length ? "Chọn biến thể" : available ? "● Còn hàng" : "● Hết hàng"}</p>
        <div className="detail-actions"><button type="button" className="add-detail" disabled={!available} onClick={() => add()}>THÊM VÀO TÚI</button><button type="button" className="buy-now" disabled={!available} onClick={() => add(true)}>MUA NGAY</button></div>
        {!!product.soldCount && <p>Đã bán {product.soldCount.toLocaleString("vi-VN")}</p>}
        {vouchers.length > 0 && <div className="pdp-vouchers"><h2>VOUCHER TIẾT KIỆM</h2>{vouchers.map((voucher) => <div key={voucher.code}><strong>{voucher.code}</strong><span>{voucher.type === "PERCENT" ? `Giảm ${voucher.value}%` : voucher.type === "FREESHIP" ? "Miễn phí vận chuyển" : `Giảm ${formatPrice(voucher.value)}`} · Đơn từ {formatPrice(voucher.minOrder)}{voucher.expiresAt && ` · HSD ${new Date(voucher.expiresAt).toLocaleDateString("vi-VN")}`}</span><button type="button" onClick={() => void copyVoucher(voucher.code)}>Sao chép</button></div>)}{copyMessage && <p role="status">{copyMessage}</p>}</div>}
      </aside>
    </div>
    {(benefitText || richDescription || requiresDisclaimer(product.categoryId ?? null, categoryTree)) && <section className="product-page-section"><details open><summary><h2>Công dụng</h2></summary>{product.shortDescription && richDescription && <p className="product-prose">{product.shortDescription}</p>}{richDescription ? <div className="product-prose" dangerouslySetInnerHTML={{ __html: product.description }}/> : benefitText && <p className="product-prose">{benefitText}</p>}{requiresDisclaimer(product.categoryId ?? null, categoryTree) && <p className="tpcn-disclaimer">Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.</p>}</details></section>}
    {usageLines.length > 0 && <section className="product-page-section"><details><summary><h2>Thành phần & cách dùng</h2></summary>{usageLines.map((line) => <p className="product-prose" key={line}>{line}</p>)}</details></section>}
    <section className="product-page-section"><details><summary><h2>Thông số sản phẩm</h2></summary><dl className="product-specs">{product.brand && <><dt>Thương hiệu</dt><dd>{product.brand}</dd></>}{product.origin && <><dt>Xuất xứ</dt><dd>{product.origin}</dd></>}{product.specification && <><dt>Quy cách</dt><dd>{product.specification}</dd></>}{product.expiryDate && <><dt>Hạn sử dụng</dt><dd>{new Date(`${product.expiryDate}T00:00:00Z`).toLocaleDateString("vi-VN", { timeZone: "UTC" })}</dd></>}<dt>Danh mục</dt><dd>{product.category}</dd>{product.variant && <><dt>Biến thể</dt><dd>{product.variant}</dd></>}<dt>Mã sản phẩm</dt><dd>TNG-{String(product.id).padStart(3, "0")}</dd></dl></details></section>
    <section className="product-page-section"><h2>Đánh giá đã duyệt</h2>{reviews.length ? reviews.map((review) => <article className="product-review" key={review.id}><strong>{"★".repeat(review.rating)} · {review.title}</strong><p>{review.content}</p><small>{review.customerName ?? "Khách hàng"}</small>{review.shopReply && <div className="shop-reply"><strong>Phản hồi từ THUYNGA Shop</strong><p>{review.shopReply}</p></div>}</article>) : <p>Chưa có đánh giá được duyệt.</p>}</section>
    {related.length > 0 && <section className="product-page-section"><h2>Sản phẩm liên quan</h2><div className="related-products">{related.map((item) => <article key={item.id}><button type="button" className="card-wishlist" aria-label={wishlist.ids.includes(item.id) ? `Bỏ yêu thích ${item.name}` : `Yêu thích ${item.name}`} aria-pressed={wishlist.ids.includes(item.id)} onClick={() => void wishlist.toggle(item.id)}>{wishlist.ids.includes(item.id) ? "♥" : "♡"}</button><a href={`/san-pham/${item.slug}`}><div className="related-image"><img src={item.image} alt={`${item.brand} ${item.name}`} loading="lazy"/></div><h3>{item.name}</h3></a>{summaries[item.id] && <p className="product-rating">★ {summaries[item.id].average.toLocaleString("vi-VN")} ({summaries[item.id].count})</p>}<strong>{formatPrice(flashActive(settings) && item.flashPrice != null ? item.flashPrice : item.price)}</strong></article>)}</div></section>}
  </div></main><Footer site={site}/>{sticky && !cartOpen && <div className="pdp-sticky-buy"><strong>{formatPrice(displayPrice)}</strong><button disabled={!available} onClick={() => add()}>Thêm vào túi</button><button disabled={!available} onClick={() => add(true)}>Mua ngay</button></div>}{lightbox && <div className="pdp-lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh sản phẩm" onClick={() => setLightbox(false)}><button className="pdp-lightbox-close" onClick={() => setLightbox(false)} aria-label="Đóng">×</button><button onClick={(event) => { event.stopPropagation(); setImage(images[(images.indexOf(image) + images.length - 1) % images.length]); }} aria-label="Ảnh trước">‹</button><img src={image} alt={product.name} onClick={(event) => event.stopPropagation()}/><button onClick={(event) => { event.stopPropagation(); setImage(images[(images.indexOf(image) + 1) % images.length]); }} aria-label="Ảnh sau">›</button><span>{images.indexOf(image) + 1}/{images.length}</span></div>}<CartDrawer open={cartOpen} count={count} products={products} cart={cart} subtotal={subtotal} close={() => setCartOpen(false)} update={update} checkout={() => location.assign("/thanh-toan")} format={formatPrice} flashSettings={settings}/></>;
}
