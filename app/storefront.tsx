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
import { CART_STORAGE_KEY, parseCart, storeCart } from "@/lib/cart";

type StorefrontProps = { products: Product[]; categories: string[]; reviewSummaries: Record<number, ReviewSummary>; policies: { shipping: string; returns: string; contact: string } };

export default function Storefront({ products, categories, reviewSummaries, policies }: StorefrontProps) {
  const [cart, setCart] = useState<Record<number, number>>({});
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

  useEffect(() => {
    const available = new Set(products.map(({ id }) => id));
    setCart(Object.fromEntries(Object.entries(parseCart(localStorage.getItem(CART_STORAGE_KEY))).filter(([id]) => available.has(Number(id)))));
    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") ?? "");
    const requestedCategory = params.get("category");
    setCategory(requestedCategory && categories.includes(requestedCategory) ? requestedCategory : "Tất cả");
  }, [products, categories]);

  const categoryOf = (product: Product) => product.category;
  const filtered = products.filter((p) =>
    `${p.brand} ${p.name}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (category === "Tất cả" || categoryOf(p) === category)
  ).sort((a, b) => sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : a.id - b.id);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = useMemo(
    () => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0),
    [cart]
  );
  const visibleProducts = filtered.slice(0, showAllProducts || query ? undefined : 12);

  const add = (id: number, quantity = 1) => {
    const next = { ...cart, [id]: Math.min(99, (cart[id] || 0) + quantity) };
    setCart(next);
    storeCart(next);
    setCartOpen(true);
  };
  const buyNow = (id: number, quantity = 1) => {
    const next = { ...cart, [id]: Math.min(99, (cart[id] || 0) + quantity) };
    storeCart(next);
    location.assign("/thanh-toan");
  };
  const update = (id: number, delta: number) =>
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
      <Header menuOpen={menuOpen} searchOpen={searchOpen} query={query} count={count} setMenuOpen={setMenuOpen} setSearchOpen={setSearchOpen} setQuery={setQuery} setCategory={setCategory} openCart={() => setCartOpen(true)}/>
      <Hero heroIndex={heroIndex} setHeroIndex={setHeroIndex}/>
      <ProductGrid categories={categories} category={category} sort={sort} query={query} filtered={filtered} visibleProducts={visibleProducts} showAllProducts={showAllProducts} setCategory={setCategory} setSort={setSort} setShowAllProducts={setShowAllProducts} openProduct={openProduct} buyNow={buyNow} format={format} reviewSummaries={reviewSummaries}/>

      <section className="feature-banner">
        <div><p>THUYNGA BEAUTY EDIT</p><h2>Mỗi ngày là một<br/><em>khoảnh khắc đẹp.</em></h2><span>Một chút chăm sóc, một chút sắc màu — để bạn luôn là phiên bản mình yêu thích.</span><a href="#new-arrivals">KHÁM PHÁ THÊM <ArrowUpRight size={16}/></a></div>
        <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=85" alt="Bộ sưu tập mỹ phẩm" loading="lazy"/>
      </section>

      <section className="category-section section" id="categories">
        <div className="section-intro"><div><span className="section-overline">02 / MUA SẮM THEO NHU CẦU</span><h2>Khám phá danh mục</h2></div><p>Từ bước chăm sóc da mỗi ngày đến điểm nhấn cuối cùng cho diện mạo của bạn.</p></div>
        <div className="beauty-categories">
          <a className="beauty-category" href="#deals" onClick={() => setCategory("Chăm sóc da")}><img src="https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=85" alt="Chăm sóc da" loading="lazy"/><span>01 / SKINCARE</span><strong>Chăm sóc da</strong><ArrowUpRight size={23}/></a>
          <a className="beauty-category" href="#deals" onClick={() => setCategory("Trang điểm")}><img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85" alt="Trang điểm" loading="lazy"/><span>02 / MAKEUP</span><strong>Trang điểm</strong><ArrowUpRight size={23}/></a>
          <a className="beauty-category" href="#deals" onClick={() => setCategory("Tóc & cơ thể")}><img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85" alt="Cảm hứng chăm sóc tóc và cơ thể" loading="lazy"/><span>03 / BODY & HAIR</span><strong>Tóc & cơ thể</strong><ArrowUpRight size={23}/></a>
        </div>
      </section>

      <section className="new-products section" id="new-arrivals">
        <div className="section-heading">
          <div><span className="section-overline">03 / GỢI Ý CHO BẠN</span><h2>BEAUTY EDIT</h2><p>Thêm cảm hứng cho giỏ hàng của bạn, từ dưỡng da đến chăm sóc cơ thể.</p></div>
          <a href="#deals" onClick={() => setShowAllProducts(true)}>Xem tất cả <ArrowUpRight size={15}/></a>
        </div>
        <div className="new-grid">
          {products.slice(16, 24).map((p, index) => <article className="new-card" key={p.id}>
            <div className="new-index">0{index + 1}</div>
            <a className="new-image-open" href={`/san-pham/${p.slug}`} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} loading="lazy"/></a>
            <div><p>{p.brand}</p><h3><a className="product-link" href={`/san-pham/${p.slug}`}>{p.name}</a></h3>{reviewSummaries[p.id] && <p className="product-rating">★ {reviewSummaries[p.id].average.toLocaleString("vi-VN")} ({reviewSummaries[p.id].count})</p>}<strong>{format(p.price)}</strong><button onClick={() => add(p.id)} aria-label={`Thêm ${p.name} vào túi`}><ShoppingBag size={16}/></button></div>
          </article>)}
        </div>
      </section>

      <section className="price-edit section" id="under-million">
        <div className="section-heading">
          <div><span className="section-overline">04 / DỄ BẮT ĐẦU</span><h2>ĐẸP MỖI NGÀY, GIÁ DỄ CHỌN</h2><p>Những món nhỏ xinh dưới 1 triệu đồng trong danh mục mẫu.</p></div>
          <a href="#deals" onClick={() => { setShowAllProducts(true); setSort("price-asc"); }}>Khám phá tất cả <ArrowUpRight size={15}/></a>
        </div>
        <div className="price-edit-grid">
          {products.filter((p) => p.price < 1000000).slice(0, 6).map((p) => <article className="price-edit-card" key={p.id}>
            <a className="price-edit-image" href={`/san-pham/${p.slug}`} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} loading="lazy"/></a>
            <div><small>{p.brand}</small><h3><a className="product-link" href={`/san-pham/${p.slug}`}>{p.name}</a></h3>{reviewSummaries[p.id] && <p className="product-rating">★ {reviewSummaries[p.id].average.toLocaleString("vi-VN")} ({reviewSummaries[p.id].count})</p>}<strong>{format(p.price)}</strong><button className="price-edit-buy" onClick={() => buyNow(p.id)}>MUA NGAY <ArrowUpRight size={13}/></button></div>
          </article>)}
        </div>
      </section>

      <section className="brand-strip" aria-label="Các nhu cầu làm đẹp"><p>CHỌN MÓN ĐẸP THEO NHU CẦU</p><div><span>DƯỠNG ẨM</span><span>LÀM SẠCH</span><span>TRANG ĐIỂM</span><span>CHĂM SÓC TÓC</span><span>CHĂM SÓC CƠ THỂ</span></div></section>

      <section className="journal section">
        <div className="section-intro"><div><span className="section-overline">05 / THE BEAUTY NOTES</span><h2>Cảm hứng mỗi ngày</h2></div><p>Những ý tưởng nhỏ để việc chăm sóc bản thân luôn là một niềm vui.</p></div>
        <div className="journal-grid">
          <a href="#deals" onClick={() => setCategory("Chăm sóc da")}><img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=950&q=85" alt="Cảm hứng chăm sóc bản thân" loading="lazy"/><span>01 / BEAUTY RITUAL</span><h3>Vẻ đẹp bắt đầu từ những phút dành cho mình</h3><small>KHÁM PHÁ CHĂM SÓC DA <ArrowUpRight size={14}/></small></a>
          <a href="#deals" onClick={() => setCategory("Trang điểm")}><img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=950&q=85" alt="Các sản phẩm trang điểm" loading="lazy"/><span>02 / COLOR STORY</span><h3>Một sắc màu nhỏ, một ngày thật khác</h3><small>KHÁM PHÁ TRANG ĐIỂM <ArrowUpRight size={14}/></small></a>
          <a href="#deals" onClick={() => setCategory("Tóc & cơ thể")}><img src="https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=950&q=85" alt="Chăm sóc tóc và cơ thể" loading="lazy"/><span>03 / SELF CARE</span><h3>Nhịp chăm sóc dịu dàng cho mỗi ngày</h3><small>KHÁM PHÁ SẢN PHẨM <ArrowUpRight size={14}/></small></a>
        </div>
      </section>

      <section className="benefits">
        <div><Sparkles size={30}/><h3>Chọn lọc tinh tế</h3><p>Khám phá sản phẩm theo từng nhu cầu làm đẹp.</p></div>
        <div><Search size={30}/><h3>Tìm kiếm dễ dàng</h3><p>Chọn danh mục hoặc tìm tên sản phẩm thật nhanh.</p></div>
        <div><ShoppingBag size={30}/><h3>Mua sắm thuận tiện</h3><p>Xem chi tiết, thêm vào túi và đặt hàng trong vài bước.</p></div>
        <div><Headphones size={30}/><h3>Thông tin rõ ràng</h3><p>Chính sách và kênh hỗ trợ sẽ cập nhật khi vận hành.</p></div>
      </section>

      <Footer/>
      <ProductDetailModal product={selectedProduct} quantity={detailQty} setQuantity={setDetailQty} close={() => setSelectedProduct(null)} add={add} buyNow={buyNow} categoryOf={categoryOf} format={format} policies={policies}/>
      <CartDrawer open={cartOpen} count={count} products={products} cart={cart} subtotal={subtotal} close={() => setCartOpen(false)} update={update} checkout={() => location.assign("/thanh-toan")} format={format}/>
    </main>
  );
}
