"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Headphones, Menu, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { categories, categoryOf, formatPrice as format, products, type Product } from "../catalog/products";

export default function Storefront() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("featured");
  const [detailQty, setDetailQty] = useState(1);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const filtered = products.filter((p) =>
    `${p.brand} ${p.name}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (category === "Tất cả" || categoryOf(p) === category)
  ).sort((a, b) => sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : a.id - b.id);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = useMemo(
    () => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0),
    [cart]
  );
  const shipping = subtotal >= 1000000 || !subtotal ? 0 : 30000;
  const visibleProducts = filtered.slice(0, showAllProducts || query ? undefined : 12);

  const add = (id: number, quantity = 1) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + quantity }));
    setCartOpen(true);
  };
  const buyNow = (id: number, quantity = 1) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + quantity }));
    setSelectedProduct(null);
    setCheckout(true);
  };
  const update = (id: number, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] || 0) + delta);
      const copy = { ...c, [id]: next };
      if (!next) delete copy[id];
      return copy;
    });

  const submitOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOrdered(true);
    setCart({});
  };
  const openProduct = (product: Product) => { setSelectedProduct(product); setDetailQty(1); };

  return (
    <main>
      <div className="store-note"><span>THUYNGA BEAUTY EDIT</span><span>Vẻ đẹp được chọn lọc cho bạn</span><a href="#deals">KHÁM PHÁ NGAY <ArrowUpRight size={13}/></a></div>
      <header className="header">
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu"><Menu size={22}/></button>
        <nav className={menuOpen ? "nav open" : "nav"}>
          <a href="#deals" onClick={() => {setCategory("Tất cả");setMenuOpen(false)}}>SẢN PHẨM</a>
          <a href="#deals" onClick={() => {setCategory("Chăm sóc da");setMenuOpen(false)}}>CHĂM SÓC DA</a>
          <a href="#deals" onClick={() => {setCategory("Trang điểm");setMenuOpen(false)}}>TRANG ĐIỂM</a>
          <a href="#deals" onClick={() => {setCategory("Tóc & cơ thể");setMenuOpen(false)}}>TÓC & CƠ THỂ</a>
        </nav>
        <a href="#deals" className="logo brand-logo" aria-label="THUYNGA Shop"><img src="/thuynga-logo-wine.png" alt="THUYNGA Shop"/></a>
        <div className="header-actions">
          <label className="search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sản phẩm, thương hiệu..." />
            <Search size={17}/>
          </label>
          <button className="mobile-search-button" onClick={() => setSearchOpen(!searchOpen)} aria-label={searchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}>{searchOpen ? <X size={19}/> : <Search size={19}/>}</button>
          <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Mở túi hàng, ${count} sản phẩm`}><ShoppingBag size={18}/><span>Túi hàng</span><b>{count}</b></button>
        </div>
      </header>
      {searchOpen && <div className="mobile-search"><Search size={17}/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sản phẩm, thương hiệu..."/><a href="#deals" onClick={() => setSearchOpen(false)}>XEM KẾT QUẢ</a></div>}

      <section className={`hero hero-slide-${heroIndex}`} aria-label="Bộ sưu tập nổi bật">
        <div className="hero-copy">
          <p className="eyebrow">THUYNGA BEAUTY SELECTION</p>
          <h1>{heroIndex === 0 ? <>SẮC ĐỎ<br/><em>VƯỢT THỜI GIAN</em></> : <>CHẠM VÀO<br/><em>VẺ ĐẸP RIÊNG</em></>}</h1>
          <p>{heroIndex === 0 ? "Một điểm nhấn khó quên trong bộ sưu tập chăm sóc da được tuyển chọn." : "Tuyển chọn mỹ phẩm cho nhịp sống hiện đại — đơn giản, tinh tế và đầy cảm hứng."}</p>
          <a href="#deals" className="primary">KHÁM PHÁ SẢN PHẨM <ArrowUpRight size={16}/></a>
          <span className="hero-number">0{heroIndex + 1} <i/> 02</span>
        </div>
        <div className="hero-image"><img src={heroIndex === 0 ? "/shiseido-eudermine-reference.png" : "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85"} alt={heroIndex === 0 ? "Shiseido Eudermine" : "Bộ sưu tập mỹ phẩm"}/><span className="hero-image-label">{heroIndex === 0 ? "SHISEIDO · EUDERMINE" : "THUYNGA BEAUTY EDIT"}</span></div>
        <button className="hero-arrow hero-prev" onClick={() => setHeroIndex((heroIndex + 1) % 2)} aria-label="Banner trước"><ChevronLeft size={21}/></button>
        <button className="hero-arrow hero-next" onClick={() => setHeroIndex((heroIndex + 1) % 2)} aria-label="Banner tiếp theo"><ChevronRight size={21}/></button>
        <div className="hero-dots"><button className={heroIndex === 0 ? "active" : ""} onClick={() => setHeroIndex(0)} aria-label="Banner 1"/><button className={heroIndex === 1 ? "active" : ""} onClick={() => setHeroIndex(1)} aria-label="Banner 2"/></div>
      </section>

      <section className="products section product-first" id="deals">
        <div className="shop-heading">
          <div><span className="section-overline">01 / BỘ SƯU TẬP MỸ PHẨM</span><h2>KHÁM PHÁ SẢN PHẨM</h2><p>30 lựa chọn chăm sóc da, trang điểm và tóc — chọn món yêu thích, xem chi tiết và mua ngay.</p></div>
        </div>
        <div className="catalog-toolbar">
          <Tabs value={category} onValueChange={setCategory}><TabsList className="catalog-tabs" aria-label="Danh mục sản phẩm">{categories.map((name) => <TabsTrigger key={name} value={name}>{name}</TabsTrigger>)}</TabsList></Tabs>
          <div className="catalog-sort"><span>{filtered.length} sản phẩm</span><label>Sắp xếp <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label></div>
        </div>
        <div className="product-grid">
          {visibleProducts.map((p) => (
            <article className="product" key={p.id}>
              <div className="product-image">
                {p.badge && <span className="product-badge">{p.badge}</span>}
                <span className="discount">-{Math.round((1 - p.price / p.oldPrice) * 100)}%</span>
                <button className="image-open" onClick={() => openProduct(p)} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} /></button>
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
      </section>

      <section className="feature-banner">
        <div><p>THUYNGA BEAUTY EDIT</p><h2>Mỗi ngày là một<br/><em>khoảnh khắc đẹp.</em></h2><span>Một chút chăm sóc, một chút sắc màu — để bạn luôn là phiên bản mình yêu thích.</span><a href="#new-arrivals">KHÁM PHÁ THÊM <ArrowUpRight size={16}/></a></div>
        <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=85" alt="Bộ sưu tập mỹ phẩm"/>
      </section>

      <section className="category-section section" id="categories">
        <div className="section-intro"><div><span className="section-overline">02 / MUA SẮM THEO NHU CẦU</span><h2>Khám phá danh mục</h2></div><p>Từ bước chăm sóc da mỗi ngày đến điểm nhấn cuối cùng cho diện mạo của bạn.</p></div>
        <div className="beauty-categories">
          <a className="beauty-category" href="#deals" onClick={() => setCategory("Chăm sóc da")}><img src="https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=85" alt="Chăm sóc da"/><span>01 / SKINCARE</span><strong>Chăm sóc da</strong><ArrowUpRight size={23}/></a>
          <a className="beauty-category" href="#deals" onClick={() => setCategory("Trang điểm")}><img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85" alt="Trang điểm"/><span>02 / MAKEUP</span><strong>Trang điểm</strong><ArrowUpRight size={23}/></a>
          <a className="beauty-category" href="#deals" onClick={() => setCategory("Tóc & cơ thể")}><img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85" alt="Cảm hứng chăm sóc tóc và cơ thể"/><span>03 / BODY & HAIR</span><strong>Tóc & cơ thể</strong><ArrowUpRight size={23}/></a>
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
            <button className="new-image-open" onClick={() => openProduct(p)} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name}/></button>
            <div><p>{p.brand}</p><h3><button className="product-link" onClick={() => openProduct(p)}>{p.name}</button></h3><strong>{format(p.price)}</strong><button onClick={() => add(p.id)} aria-label={`Thêm ${p.name} vào túi`}><ShoppingBag size={16}/></button></div>
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
            <button className="price-edit-image" onClick={() => openProduct(p)} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name}/></button>
            <div><small>{p.brand}</small><h3><button className="product-link" onClick={() => openProduct(p)}>{p.name}</button></h3><strong>{format(p.price)}</strong><button className="price-edit-buy" onClick={() => buyNow(p.id)}>MUA NGAY <ArrowUpRight size={13}/></button></div>
          </article>)}
        </div>
      </section>

      <section className="brand-strip" aria-label="Các nhu cầu làm đẹp"><p>CHỌN MÓN ĐẸP THEO NHU CẦU</p><div><span>DƯỠNG ẨM</span><span>LÀM SẠCH</span><span>TRANG ĐIỂM</span><span>CHĂM SÓC TÓC</span><span>CHĂM SÓC CƠ THỂ</span></div></section>

      <section className="journal section">
        <div className="section-intro"><div><span className="section-overline">05 / THE BEAUTY NOTES</span><h2>Cảm hứng mỗi ngày</h2></div><p>Những ý tưởng nhỏ để việc chăm sóc bản thân luôn là một niềm vui.</p></div>
        <div className="journal-grid">
          <a href="#deals" onClick={() => setCategory("Chăm sóc da")}><img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=950&q=85" alt="Cảm hứng chăm sóc bản thân"/><span>01 / BEAUTY RITUAL</span><h3>Vẻ đẹp bắt đầu từ những phút dành cho mình</h3><small>KHÁM PHÁ CHĂM SÓC DA <ArrowUpRight size={14}/></small></a>
          <a href="#deals" onClick={() => setCategory("Trang điểm")}><img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=950&q=85" alt="Các sản phẩm trang điểm"/><span>02 / COLOR STORY</span><h3>Một sắc màu nhỏ, một ngày thật khác</h3><small>KHÁM PHÁ TRANG ĐIỂM <ArrowUpRight size={14}/></small></a>
          <a href="#deals" onClick={() => setCategory("Tóc & cơ thể")}><img src="https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=950&q=85" alt="Chăm sóc tóc và cơ thể"/><span>03 / SELF CARE</span><h3>Nhịp chăm sóc dịu dàng cho mỗi ngày</h3><small>KHÁM PHÁ SẢN PHẨM <ArrowUpRight size={14}/></small></a>
        </div>
      </section>

      <section className="benefits">
        <div><Sparkles size={30}/><h3>Chọn lọc tinh tế</h3><p>Khám phá sản phẩm theo từng nhu cầu làm đẹp.</p></div>
        <div><Search size={30}/><h3>Tìm kiếm dễ dàng</h3><p>Chọn danh mục hoặc tìm tên sản phẩm thật nhanh.</p></div>
        <div><ShoppingBag size={30}/><h3>Mua sắm thuận tiện</h3><p>Xem chi tiết, thêm vào túi và đặt hàng trong vài bước.</p></div>
        <div><Headphones size={30}/><h3>Thông tin rõ ràng</h3><p>Chính sách và kênh hỗ trợ sẽ cập nhật khi vận hành.</p></div>
      </section>

      <footer id="about">
        <div className="footer-brand"><a className="logo brand-logo" aria-label="THUYNGA Shop"><img src="/thuynga-logo-wine.png" alt="THUYNGA Shop"/></a><p>Không gian khám phá mỹ phẩm và những lựa chọn làm đẹp dành cho bạn.</p></div>
        <div><h4>KHÁM PHÁ</h4><a href="#deals">Sản phẩm mới</a><a href="#new-arrivals">Nổi bật</a><a href="#deals">Danh mục</a></div>
        <div className="footer-pending"><h4>HỖ TRỢ</h4><span>Hướng dẫn mua hàng</span><span>Vận chuyển</span><span>Đổi trả & hoàn tiền</span><small>Chính sách chi tiết sẽ cập nhật trước khi vận hành.</small></div>
        <div className="newsletter"><h4>THUYNGA LETTER</h4><p>Câu chuyện làm đẹp và những lựa chọn được tuyển chọn dành riêng cho bạn.</p><small>Đăng ký nhận tin sẽ mở khi website vận hành.</small></div>
      </footer>
      <div className="copyright">© 2026 THUYNGA SHOP <span>Facebook · Instagram · YouTube</span></div>

      {selectedProduct && <div className="overlay product-overlay" onMouseDown={() => setSelectedProduct(null)}>
        <section className="product-detail" onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-label={`Chi tiết ${selectedProduct.name}`}>
          <button className="detail-close" onClick={() => setSelectedProduct(null)} aria-label="Đóng">×</button>
          <div className="detail-image"><img src={selectedProduct.image} alt={selectedProduct.name}/></div>
          <div className="detail-copy">
            <div className="breadcrumb">TRANG CHỦ / SẢN PHẨM / {selectedProduct.brand}</div>
            <p className="eyebrow">{selectedProduct.brand}</p>
            <h2>{selectedProduct.name}</h2>
            <p className="detail-sku">Mã sản phẩm: TNG-{String(selectedProduct.id).padStart(3, "0")}</p>
            <div className="detail-price"><strong>{format(selectedProduct.price)}</strong><del>{format(selectedProduct.oldPrice)}</del><span>Tiết kiệm {Math.round((1 - selectedProduct.price / selectedProduct.oldPrice) * 100)}%</span></div>
            <div className="detail-information"><h3>Thông tin sản phẩm</h3><p>Danh mục: {categoryOf(selectedProduct)}</p><p>Mã tham khảo: TNG-{String(selectedProduct.id).padStart(3, "0")}</p><p>Hình ảnh, giá bán, dung tích và mô tả chi tiết cần được xác nhận theo danh mục hàng thật trước khi vận hành.</p></div>
            <div className="detail-quantity"><span>Số lượng</span><div className="qty"><button onClick={() => setDetailQty(Math.max(1, detailQty - 1))} aria-label="Giảm số lượng">−</button><span>{detailQty}</span><button onClick={() => setDetailQty(detailQty + 1)} aria-label="Tăng số lượng">+</button></div></div>
            <div className="detail-actions"><button className="add-detail" onClick={() => { add(selectedProduct.id, detailQty); setSelectedProduct(null); }}>THÊM VÀO TÚI</button><button className="buy-now" onClick={() => buyNow(selectedProduct.id, detailQty)}>MUA NGAY</button></div>
            <div className="detail-benefits"><span>Giao hàng: tính ở bước thanh toán</span><span>Đổi trả và bảo hành: cập nhật theo chính sách cửa hàng khi vận hành</span><span>Tư vấn sản phẩm: thông tin liên hệ sẽ được bổ sung</span></div>
          </div>
        </section>
      </div>}

      {cartOpen && <div className="overlay" onMouseDown={() => setCartOpen(false)}>
        <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()}>
          <div className="drawer-head"><h2>Túi hàng <sup>{count}</sup></h2><button onClick={() => setCartOpen(false)}>×</button></div>
          <div className="cart-lines">
            {!count && <div className="empty"><span>◇</span><h3>Túi hàng đang trống</h3><p>Những món đồ đẹp đang chờ bạn khám phá.</p><button onClick={() => setCartOpen(false)}>TIẾP TỤC MUA SẮM</button></div>}
            {products.filter((p) => cart[p.id]).map((p) => <div className="cart-line" key={p.id}>
              <img src={p.image} alt=""/>
              <div><small>{p.brand}</small><h4>{p.name}</h4><div className="qty"><button onClick={() => update(p.id,-1)}>−</button><span>{cart[p.id]}</span><button onClick={() => update(p.id,1)}>+</button></div></div>
              <strong>{format(p.price * cart[p.id])}</strong>
            </div>)}
          </div>
          {!!count && <div className="cart-footer">
            <div><span>Tạm tính</span><strong>{format(subtotal)}</strong></div>
            <p>Phí vận chuyển được tính ở bước thanh toán.</p>
            <button onClick={() => { setCartOpen(false); setCheckout(true); }}>THANH TOÁN · {format(subtotal)}</button>
          </div>}
        </aside>
      </div>}

      {checkout && <div className="checkout">
        <div className="checkout-top"><a className="logo brand-logo" aria-label="THUYNGA Shop"><img src="/thuynga-logo-wine.png" alt="THUYNGA Shop"/></a><button onClick={() => {setCheckout(false); setOrdered(false)}}>×</button></div>
        {ordered ? <div className="success"><span>✓</span><p className="eyebrow">BẢN DEMO</p><h2>Đã hoàn tất thao tác đặt hàng mẫu.</h2><p>Chưa có đơn hàng thật được tạo hoặc gửi đi. Chức năng lưu đơn và thanh toán sẽ được kết nối khi triển khai website.</p><button onClick={() => {setCheckout(false);setOrdered(false)}}>TIẾP TỤC KHÁM PHÁ</button></div> :
        <form onSubmit={submitOrder} className="checkout-grid">
          <section className="checkout-form">
            <p className="checkout-demo-warning">BẢN XEM TRƯỚC · Vui lòng không nhập thông tin cá nhân thật. Đơn hàng không được lưu hoặc thanh toán.</p>
            <div className="checkout-steps"><b>1 Thông tin</b><span>2 Vận chuyển</span><span>3 Thanh toán</span></div>
            <h2>Thông tin giao hàng</h2>
            <div className="field-grid">
              <label className="full"><span>Email</span><input type="email" required placeholder="hello@example.com"/></label>
              <label><span>Họ và tên</span><input required placeholder="Nguyễn Minh Anh"/></label>
              <label><span>Số điện thoại</span><input required pattern="[0-9]{9,11}" placeholder="090 123 4567"/></label>
              <label className="full"><span>Địa chỉ</span><input required placeholder="Số nhà, tên đường"/></label>
              <label><span>Tỉnh / Thành phố</span><select required defaultValue=""><option value="" disabled>Chọn tỉnh / thành</option><option>TP. Hồ Chí Minh</option><option>Hà Nội</option><option>Đà Nẵng</option><option>Cần Thơ</option></select></label>
              <label><span>Quận / Huyện</span><input required placeholder="Quận / Huyện"/></label>
            </div>
            <h2>Phương thức vận chuyển</h2>
            <label className="method selected"><input type="radio" defaultChecked name="shipping"/><span><b>Giao hàng tiêu chuẩn</b><small>2–4 ngày làm việc</small></span><strong>{shipping ? format(shipping) : "MIỄN PHÍ"}</strong></label>
            <h2>Phương thức thanh toán</h2>
            <div className="payment-methods">
              <label className="method"><input type="radio" defaultChecked name="payment"/><span><b>Thanh toán khi nhận hàng (COD)</b><small>Thanh toán tiền mặt cho đơn vị vận chuyển</small></span></label>
              <label className="method method-unavailable"><input type="radio" name="payment" disabled/><span><b>Thẻ ATM / Visa / Mastercard</b><small>Sẽ kết nối khi đưa vào vận hành</small></span><i>VISA · MC</i></label>
              <label className="method method-unavailable"><input type="radio" name="payment" disabled/><span><b>Chuyển khoản ngân hàng</b><small>Sẽ mở khi đưa vào vận hành</small></span></label>
            </div>
            <button className="place-order" type="submit">XEM XÁC NHẬN MẪU · {format(subtotal + shipping)}</button>
            <p className="secure">Đây là bản demo giao diện, chưa xử lý thanh toán thật.</p>
          </section>
          <aside className="order-summary">
            <h2>Đơn hàng của bạn</h2>
            {products.filter((p) => cart[p.id]).map((p) => <div className="summary-line" key={p.id}><div><img src={p.image} alt=""/><b>{cart[p.id]}</b></div><span><small>{p.brand}</small>{p.name}</span><strong>{format(p.price * cart[p.id])}</strong></div>)}
            <div className="totals"><p><span>Tạm tính</span><b>{format(subtotal)}</b></p><p><span>Vận chuyển</span><b>{shipping ? format(shipping) : "Miễn phí"}</b></p><p className="grand"><span>Tổng cộng</span><b>{format(subtotal + shipping)}</b></p></div>
          </aside>
        </form>}
      </div>}
    </main>
  );
}
