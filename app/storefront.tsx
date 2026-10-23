"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Headphones, Search, ShoppingBag, Sparkles } from "lucide-react";
import CartDrawer from "@/components/storefront/CartDrawer";
import Footer from "@/components/storefront/Footer";
import Header from "@/components/storefront/Header";
import Hero from "@/components/storefront/Hero";
import ProductDetailModal from "@/components/storefront/ProductDetailModal";
import ProductGrid from "@/components/storefront/ProductGrid";
import type { Product } from "@/components/storefront/types";
import type { ReviewSummary } from "@/db/store";
import { formatPrice as format } from "@/catalog/products";
import { CART_STORAGE_KEY, cartItem, cartLines, parseCart, storeCart } from "@/lib/cart";
import { pricedLine } from "@/lib/product-pricing";
import { flashActive } from "@/lib/product-pricing";
import { useWishlist } from "@/lib/wishlist";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { categoryDescendants, visibleCategories, type ShopCategory } from "@/lib/categories";

type StorefrontProps = { products: Product[]; categories: string[]; categoryTree: ShopCategory[]; reviewSummaries: Record<number, ReviewSummary>; policies: { shipping: string; returns: string; contact: string }; site?: SiteContent; flashSettings?: { flashSaleTitle?: string; flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null } };

export default function Storefront({ products, categories, categoryTree, reviewSummaries, policies, site = defaultSiteContent, flashSettings = {} }: StorefrontProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("featured");
  const [detailQty, setDetailQty] = useState(1);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const wishlist = useWishlist();
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const flashProducts = flashActive(flashSettings, new Date(now)) ? products.filter((item) => item.flashPrice != null && (item.flashStock == null || item.flashStock > 0)) : [];
  const secondsLeft = Math.max(0, Math.floor((new Date(flashSettings.flashSaleEnd ?? 0).getTime() - now) / 1000));
  const cardPrice = (item: Product) => flashActive(flashSettings) && item.flashPrice != null ? item.flashPrice : item.price;
  const roots = visibleCategories(categoryTree).filter(({ parentId }) => !parentId);

  useEffect(() => {
    const available = new Set(products.map(({ id }) => id));
    setCart(Object.fromEntries(Object.entries(parseCart(localStorage.getItem(CART_STORAGE_KEY))).filter(([key]) => available.has(cartItem(key).productId))));
    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") ?? "");
    setBrandFilter(params.get("brand") ?? "");
    const requestedCategory = params.get("category");
    setCategory(requestedCategory && categories.includes(requestedCategory) ? requestedCategory : "Tất cả");
  }, [products, categories]);

  const categoryOf = (product: Product) => product.category;
  const filtered = products.filter((p) =>
    `${p.brand} ${p.name}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (!brandFilter || p.brand.toLocaleLowerCase("vi-VN") === brandFilter.toLocaleLowerCase("vi-VN")) &&
    (category === "Tất cả" || categoryDescendants(roots.find((item) => item.name === category)!, categoryTree).includes(p.categoryId ?? -1))
  ).sort((a, b) => sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : a.id - b.id);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = useMemo(
    () => cartLines(cart, products).reduce((sum, { product, variantName, quantity }) => sum + (pricedLine(product, variantName, flashSettings)?.price ?? product.price) * quantity, 0),
    [cart, products, flashSettings]
  );
  const visibleProducts = filtered.slice(0, showAllProducts || query ? undefined : 12);

  const add = (id: number, quantity = 1) => {
    if (products.find((item) => item.id === id)?.variantRows?.length) return location.assign(`/san-pham/${products.find((item) => item.id === id)!.slug}`);
    const next = { ...cart, [id]: Math.min(99, (cart[id] || 0) + quantity) };
    setCart(next);
    storeCart(next);
    setCartOpen(true);
  };
  const buyNow = (id: number, quantity = 1) => {
    if (products.find((item) => item.id === id)?.variantRows?.length) return location.assign(`/san-pham/${products.find((item) => item.id === id)!.slug}`);
    const next = { ...cart, [id]: Math.min(99, (cart[id] || 0) + quantity) };
    storeCart(next);
    location.assign("/thanh-toan");
  };
  const update = (id: string, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] || 0) + delta);
      const copy = { ...c, [id]: next };
      if (!next) delete copy[id];
      storeCart(copy);
      return copy;
    });
  const openProduct = (product: Product) => { setSelectedProduct(product); setDetailQty(1); };

  return (
    <main>
      <Header menuOpen={menuOpen} searchOpen={searchOpen} query={query} count={count} setMenuOpen={setMenuOpen} setSearchOpen={setSearchOpen} setQuery={setQuery} setCategory={setCategory} openCart={() => setCartOpen(true)} site={site} categoryTree={categoryTree}/>
      <Hero heroIndex={heroIndex} setHeroIndex={setHeroIndex} slides={site.hero}/>
      {flashProducts.length > 0 && <section className="flash-sale section"><h2>{flashSettings.flashSaleTitle || "Flash Sale"}</h2><p role="timer">Kết thúc sau {String(Math.floor(secondsLeft / 3600)).padStart(2, "0")}:{String(Math.floor(secondsLeft / 60) % 60).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</p><div className="product-grid">{flashProducts.map((item) => <article className="product" key={item.id}><button type="button" className="card-wishlist" aria-label={wishlist.ids.includes(item.id) ? `Bỏ yêu thích ${item.name}` : `Yêu thích ${item.name}`} aria-pressed={wishlist.ids.includes(item.id)} onClick={() => void wishlist.toggle(item.id)}>{wishlist.ids.includes(item.id) ? "♥" : "♡"}</button><a href={`/san-pham/${item.slug}`}><img src={item.image} alt={item.name} loading="lazy"/><h3>{item.name}</h3></a><div className="price"><strong>{format(item.flashPrice!)}</strong><del>{format(item.price)}</del></div>{item.flashStock != null && <><progress max={(item.soldCount ?? 0) + item.flashStock || 1} value={item.soldCount ?? 0}/><small>Đã bán {item.soldCount ?? 0}</small></>}</article>)}</div></section>}
      {site.sections.deals.enabled && <ProductGrid categories={categories} category={category} sort={sort} query={query} filtered={filtered} visibleProducts={visibleProducts} showAllProducts={showAllProducts} setCategory={setCategory} setSort={setSort} setShowAllProducts={setShowAllProducts} openProduct={openProduct} buyNow={buyNow} format={format} reviewSummaries={reviewSummaries} section={site.sections.deals} flashSettings={flashSettings}/>}

      {site.sections.feature.enabled && <section className="feature-banner">
        <div><p>THUYNGA SHOP · HÀNG NHẬP KHẨU</p><h2>{site.sections.feature.title.split("\n")[0]}<br/><em>{site.sections.feature.title.split("\n").slice(1).join(" ")}</em></h2><span>{site.sections.feature.subtitle}</span><a href="#new-arrivals">KHÁM PHÁ THÊM <ArrowUpRight size={16}/></a></div>
        <img src={site.home.featureImage || defaultSiteContent.home.featureImage} alt="Hàng nhập khẩu chọn lọc" loading="lazy"/>
      </section>}

      {site.sections.categories.enabled && <section className="category-section section" id="categories">
        <div className="section-intro"><div><span className="section-overline">02 / MUA SẮM THEO NHU CẦU</span><h2>{site.sections.categories.title}</h2></div><p>{site.sections.categories.subtitle}</p></div>
        <div className="beauty-categories">{roots.map((root, index) => <a className="beauty-category" href={`/danh-muc/${root.slug}`} key={root.id}><img src={root.image || `/category-${index + 1}.svg`} alt={root.name} loading="lazy"/><span>{String(index + 1).padStart(2, "0")} / DANH MỤC</span><strong>{root.name}</strong><ArrowUpRight size={23}/></a>)}</div>
      </section>}

      {site.departmentRails.filter((rail) => rail.enabled).map((rail) => { const root = roots.find((item) => item.slug === rail.categorySlug); if (!root) return null; const ids = categoryDescendants(root, categoryTree); const items = products.filter((item) => ids.includes(item.categoryId ?? -1)).slice(0, 8); return <section className="department-rail section" key={rail.categorySlug}><div className="section-heading"><div><span className="section-overline">SẢN PHẨM THEO NGÀNH</span><h2>{rail.title}</h2></div><a href={`/danh-muc/${root.slug}`}>Xem tất cả <ArrowUpRight size={15}/></a></div><div className="product-grid">{items.map((item) => <article className="product" key={item.id}><button type="button" className="card-wishlist" aria-label={wishlist.ids.includes(item.id) ? `Bỏ yêu thích ${item.name}` : `Yêu thích ${item.name}`} aria-pressed={wishlist.ids.includes(item.id)} onClick={() => void wishlist.toggle(item.id)}>{wishlist.ids.includes(item.id) ? "♥" : "♡"}</button><a className="image-open" href={`/san-pham/${item.slug}`}><div className="product-image"><img src={item.image} alt={item.name} loading="lazy"/></div></a><p className="product-brand">{item.brand}</p><h3><a className="product-link" href={`/san-pham/${item.slug}`}>{item.name}</a></h3><div className="price"><strong>{format(cardPrice(item))}</strong></div>{!!item.soldCount && <small>Đã bán {item.soldCount.toLocaleString("vi-VN")}</small>}</article>)}</div></section>; })}

      {site.sections.newProducts.enabled && <section className="new-products section" id="new-arrivals">
        <div className="section-heading">
          <div><span className="section-overline">03 / GỢI Ý CHO BẠN</span><h2>{site.sections.newProducts.title}</h2><p>{site.sections.newProducts.subtitle}</p></div>
          <a href="#deals" onClick={() => setShowAllProducts(true)}>Xem tất cả <ArrowUpRight size={15}/></a>
        </div>
        <div className="new-grid">
          {products.slice(16, 24).map((p, index) => <article className="new-card" key={p.id}>
            <button type="button" className="card-wishlist" aria-label={wishlist.ids.includes(p.id) ? `Bỏ yêu thích ${p.name}` : `Yêu thích ${p.name}`} aria-pressed={wishlist.ids.includes(p.id)} onClick={() => void wishlist.toggle(p.id)}>{wishlist.ids.includes(p.id) ? "♥" : "♡"}</button>
            <div className="new-index">0{index + 1}</div>
            <a className="new-image-open" href={`/san-pham/${p.slug}`} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} loading="lazy"/></a>
            <div><p>{p.brand}</p><h3><a className="product-link" href={`/san-pham/${p.slug}`}>{p.name}</a></h3>{reviewSummaries[p.id] && <p className="product-rating">★ {reviewSummaries[p.id].average.toLocaleString("vi-VN")} ({reviewSummaries[p.id].count})</p>}<strong>{format(cardPrice(p))}</strong>{!!p.soldCount && <small>Đã bán {p.soldCount.toLocaleString("vi-VN")}</small>}<button onClick={() => add(p.id)} aria-label={`Thêm ${p.name} vào túi`}><ShoppingBag size={16}/></button></div>
          </article>)}
        </div>
      </section>}

      {site.sections.priceEdit.enabled && <section className="price-edit section" id="under-million">
        <div className="section-heading">
          <div><span className="section-overline">04 / DỄ BẮT ĐẦU</span><h2>{site.sections.priceEdit.title}</h2><p>{site.sections.priceEdit.subtitle}</p></div>
          <a href="#deals" onClick={() => { setShowAllProducts(true); setSort("price-asc"); }}>Khám phá tất cả <ArrowUpRight size={15}/></a>
        </div>
        <div className="price-edit-grid">
          {products.filter((p) => p.price < 1000000).slice(0, 6).map((p) => <article className="price-edit-card" key={p.id}>
            <button type="button" className="card-wishlist" aria-label={wishlist.ids.includes(p.id) ? `Bỏ yêu thích ${p.name}` : `Yêu thích ${p.name}`} aria-pressed={wishlist.ids.includes(p.id)} onClick={() => void wishlist.toggle(p.id)}>{wishlist.ids.includes(p.id) ? "♥" : "♡"}</button>
            <a className="price-edit-image" href={`/san-pham/${p.slug}`} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} loading="lazy"/></a>
            <div><small>{p.brand}</small><h3><a className="product-link" href={`/san-pham/${p.slug}`}>{p.name}</a></h3>{reviewSummaries[p.id] && <p className="product-rating">★ {reviewSummaries[p.id].average.toLocaleString("vi-VN")} ({reviewSummaries[p.id].count})</p>}<strong>{format(cardPrice(p))}</strong>{!!p.soldCount && <small>Đã bán {p.soldCount.toLocaleString("vi-VN")}</small>}<button className="price-edit-buy" onClick={() => buyNow(p.id)}>MUA NGAY <ArrowUpRight size={13}/></button></div>
          </article>)}
        </div>
      </section>}

      {site.sections.brandStrip.enabled && <section className="brand-strip" aria-label="Các thương hiệu đang bán"><p>{site.sections.brandStrip.title}</p><div>{[...new Set(products.map((item) => item.brand).filter(Boolean))].map((brand) => <a href={`/?brand=${encodeURIComponent(brand)}#deals`} key={brand}>{brand}</a>)}</div></section>}

      {site.sections.journal.enabled && <section className="journal section">
        <div className="section-intro"><div><span className="section-overline">05 / KHÁM PHÁ THÊM</span><h2>{site.sections.journal.title}</h2></div><p>{site.sections.journal.subtitle}</p></div>
        <div className="journal-grid">
          {site.home.journal.map((item, index) => <a key={index} href={roots[index] ? `/danh-muc/${roots[index].slug}` : "#deals"}><img src={item.image || defaultSiteContent.home.journal[index].image} alt={item.title} loading="lazy"/><span>{item.label}</span><h3>{item.title}</h3><small>{item.linkText} <ArrowUpRight size={14}/></small></a>)}
        </div>
      </section>}

      {site.sections.benefits.enabled && <section className="benefits">
        {site.home.benefits.map((item, index) => <div key={index}>{[<Sparkles size={30}/>, <Search size={30}/>, <ShoppingBag size={30}/>, <Headphones size={30}/>][index]}<h3>{item.title}</h3><p>{item.description}</p></div>)}
      </section>}

      {site.sections.testimonials.enabled && site.testimonials.some((item) => item.enabled) && <section className="testimonials section"><div className="section-intro"><div><h2>{site.sections.testimonials.title}</h2></div><p>{site.sections.testimonials.subtitle}</p></div><div className="testimonial-grid">{site.testimonials.filter((item) => item.enabled).map((item) => <article key={item.id}>{item.image && <img src={item.image} alt={item.name} loading="lazy"/>}<p>{"★".repeat(item.rating)}</p><blockquote>{item.content}</blockquote><strong>{item.name}</strong></article>)}</div></section>}

      <Footer site={site}/>
      <ProductDetailModal product={selectedProduct} quantity={detailQty} setQuantity={setDetailQty} close={() => setSelectedProduct(null)} add={add} buyNow={buyNow} categoryOf={categoryOf} format={format} policies={policies}/>
      <CartDrawer open={cartOpen} count={count} products={products} cart={cart} subtotal={subtotal} close={() => setCartOpen(false)} update={update} checkout={() => location.assign("/thanh-toan")} format={format} flashSettings={flashSettings}/>
    </main>
  );
}
