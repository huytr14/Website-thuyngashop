"use client";

import { useMemo, useState } from "react";

type Product = {
  id: number;
  brand: string;
  name: string;
  price: number;
  oldPrice: number;
  image: string;
  badge?: string;
};

const products: Product[] = [
  { id: 1, brand: "SHISEIDO", name: "Ultimune Power Infusing Concentrate", price: 2780000, oldPrice: 3850000, image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=720&q=85", badge: "BÁN CHẠY" },
  { id: 2, brand: "LA ROCHE-POSAY", name: "Hyalu B5 Serum phục hồi chuyên sâu", price: 998000, oldPrice: 1320000, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=720&q=85" },
  { id: 3, brand: "DECORTÉ", name: "Liposome Advanced Repair Cream", price: 1599000, oldPrice: 2300000, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=720&q=85", badge: "MỚI" },
  { id: 4, brand: "KÉRASTASE", name: "Elixir Ultime dầu dưỡng tóc", price: 1250000, oldPrice: 1690000, image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=720&q=85" },
  { id: 5, brand: "SULWHASOO", name: "First Care Activating Serum VI", price: 2190000, oldPrice: 2950000, image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=720&q=85" },
  { id: 6, brand: "LANEIGE", name: "Water Sleeping Mask EX", price: 579000, oldPrice: 760000, image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=720&q=85" },
  { id: 7, brand: "ESTÉE LAUDER", name: "Advanced Night Repair Serum", price: 2450000, oldPrice: 3200000, image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=720&q=85" },
  { id: 8, brand: "SK-II", name: "Facial Treatment Essence", price: 2990000, oldPrice: 3850000, image: "https://images.unsplash.com/photo-1591130901921-3f0652bb3915?auto=format&fit=crop&w=720&q=85" },
  { id: 9, brand: "KIEHL'S", name: "Clearly Corrective Dark Spot Solution", price: 1390000, oldPrice: 1750000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=720&q=85", badge: "NEW IN" },
  { id: 10, brand: "CLINIQUE", name: "Moisture Surge 100H Auto-Replenishing", price: 1120000, oldPrice: 1480000, image: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=720&q=85" },
  { id: 11, brand: "PAULA'S CHOICE", name: "Skin Perfecting 2% BHA Liquid", price: 890000, oldPrice: 1120000, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=720&q=85", badge: "CULT FAVOURITE" },
  { id: 12, brand: "BIODERMA", name: "Sensibio H2O Micellar Water", price: 445000, oldPrice: 590000, image: "https://images.unsplash.com/photo-1611930021592-a8cfd5319ceb?auto=format&fit=crop&w=720&q=85" },
  { id: 13, brand: "LANCOME", name: "Advanced Genifique Youth Activating Serum", price: 2650000, oldPrice: 3450000, image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=720&q=85", badge: "ICONIC" },
  { id: 14, brand: "MAC", name: "Locked Kiss Ink 24HR Lipcolour", price: 825000, oldPrice: 1050000, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=720&q=85" },
  { id: 15, brand: "INNISFREE", name: "Green Tea Seed Hyaluronic Serum", price: 760000, oldPrice: 980000, image: "https://images.unsplash.com/photo-1607602132700-068258431c1c?auto=format&fit=crop&w=720&q=85", badge: "K-BEAUTY" },
  { id: 16, brand: "ANESSA", name: "Perfect UV Sunscreen Skincare Milk", price: 685000, oldPrice: 850000, image: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=720&q=85" },
];

const format = (value: number) => `${value.toLocaleString("vi-VN")}₫`;

export default function Storefront() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = products.filter((p) =>
    `${p.brand} ${p.name}`.toLowerCase().includes(query.toLowerCase())
  );
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = useMemo(
    () => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0),
    [cart]
  );
  const shipping = subtotal >= 1000000 || !subtotal ? 0 : 30000;

  const add = (id: number) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    setCartOpen(true);
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

  return (
    <main>
      <div className="announcement">MIỄN PHÍ GIAO HÀNG ĐƠN TỪ 1.000.000₫ · ĐỔI TRẢ TRONG 7 NGÀY</div>
      <header className="header">
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">☰</button>
        <a href="#" className="logo brand-logo" aria-label="THUYNGA Shop"><img src="/thuynga-logo.png" alt="THUYNGA Shop"/></a>
        <div className="header-actions">
          <label className="search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sản phẩm, thương hiệu..." />
            <span>⌕</span>
          </label>
          <button className="account">♙ <span>Tài khoản</span></button>
          <button className="cart-button" onClick={() => setCartOpen(true)}>Túi hàng <b>{count}</b></button>
        </div>
      </header>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <a href="#deals">ƯU ĐÃI THEO CHƯƠNG TRÌNH</a>
        <a href="#brands">THƯƠNG HIỆU</a>
        <a href="#categories">SẢN PHẨM THEO NHU CẦU</a>
        <a href="#journal">CẨM NANG</a>
        <a href="#about">VỀ CHÚNG TÔI</a>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">THE SUMMER EDIT · 2026</p>
          <h1>Vẻ đẹp được<br/><em>chọn lọc.</em></h1>
          <p>Những biểu tượng làm đẹp được yêu thích, chính hãng và tuyển chọn bởi đội ngũ THUYNGA Shop.</p>
          <a href="#deals" className="primary">KHÁM PHÁ ƯU ĐÃI <span>→</span></a>
        </div>
        <div className="hero-image">
          <div className="hero-note"><strong>ĐẾN 45%</strong><span>Ưu đãi mùa hè</span></div>
        </div>
      </section>

      <section className="brands" id="brands">
        <span>SHISEIDO</span><span>SK-II</span><span>LA ROCHE-POSAY</span><span>KÉRASTASE</span><span>SULWHASOO</span><span>DECORTÉ</span>
      </section>

      <section className="quick-links">
        <a href="#deals"><span>01</span><b>Skincare cao cấp</b><small>Khám phá 120+ sản phẩm →</small></a>
        <a href="#new-arrivals"><span>02</span><b>New beauty drops</b><small>Cập nhật mỗi tuần →</small></a>
        <a href="#deals"><span>03</span><b>Quà tặng tinh tế</b><small>Tuyển chọn theo dịp →</small></a>
        <a href="#journal"><span>04</span><b>Beauty consultation</b><small>Được tư vấn miễn phí →</small></a>
      </section>

      <section className="categories section" id="categories">
        <div className="section-heading">
          <div><p className="eyebrow">MUA SẮM THEO NHU CẦU</p><h2>Nghi thức dành riêng cho bạn</h2></div>
          <a href="#deals">Xem tất cả →</a>
        </div>
        <div className="category-grid">
          <a className="category skin" href="#deals"><span>01</span><div><h3>Chăm sóc da</h3><p>Serum · Kem dưỡng · Mặt nạ</p></div></a>
          <a className="category makeup" href="#deals"><span>02</span><div><h3>Trang điểm</h3><p>Cushion · Son · Phấn phủ</p></div></a>
          <a className="category hair" href="#deals"><span>03</span><div><h3>Tóc & cơ thể</h3><p>Dầu gội · Dưỡng tóc · Nước hoa</p></div></a>
        </div>
      </section>

      <section className="campaign-band">
        <div className="campaign-copy">
          <p className="eyebrow">EXCLUSIVE BEAUTY WEEK</p>
          <h2>Quà tặng đến<br/><em>1.500.000₫</em></h2>
          <p>Khi mua sắm các thương hiệu Shiseido, Sulwhasoo, SK-II và Lancôme. Số lượng giới hạn.</p>
          <a href="#deals">MUA SẮM NGAY →</a>
        </div>
        <div className="campaign-image" />
        <div className="campaign-number">08.25</div>
      </section>

      <section className="new-products section" id="new-arrivals">
        <div className="section-heading">
          <div><p className="eyebrow">JUST LANDED</p><h2>Vừa cập bến THUYNGA</h2></div>
          <a href="#deals">Xem tất cả →</a>
        </div>
        <div className="new-grid">
          {products.slice(8, 12).map((p, index) => <article className="new-card" key={p.id}>
            <div className="new-index">0{index + 1}</div>
            <img src={p.image} alt={p.name}/>
            <div><p>{p.brand}</p><h3>{p.name}</h3><strong>{format(p.price)}</strong><button onClick={() => add(p.id)}>+</button></div>
          </article>)}
        </div>
      </section>

      <section className="products section" id="deals">
        <div className="section-heading">
          <div><p className="eyebrow">THUYNGA OFFERS</p><h2>Ưu đãi nổi bật</h2></div>
          <p className="result">{filtered.length} sản phẩm</p>
        </div>
        <div className="product-grid">
          {filtered.map((p) => (
            <article className="product" key={p.id}>
              <div className="product-image">
                {p.badge && <span className="product-badge">{p.badge}</span>}
                <span className="discount">-{Math.round((1 - p.price / p.oldPrice) * 100)}%</span>
                <img src={p.image} alt={p.name} />
                <button onClick={() => add(p.id)}>THÊM VÀO TÚI</button>
              </div>
              <p className="product-brand">{p.brand}</p>
              <h3>{p.name}</h3>
              <div className="price"><strong>{format(p.price)}</strong><del>{format(p.oldPrice)}</del></div>
            </article>
          ))}
        </div>
        {!filtered.length && <div className="empty-search">Không tìm thấy sản phẩm phù hợp.</div>}
      </section>

      <section className="editorial" id="journal">
        <div className="editorial-image" />
        <div className="editorial-copy"><p className="eyebrow">THE THUYNGA JOURNAL</p><h2>Làn da mùa hè:<br/>ít hơn, hiệu quả hơn.</h2><p>Khám phá routine 4 bước giúp làn da cân bằng, trong trẻo và được bảo vệ suốt ngày dài.</p><a href="#">ĐỌC CẨM NANG →</a></div>
      </section>

      <section className="social-proof section">
        <div className="proof-intro"><p className="eyebrow">TRUSTED BY BEAUTY LOVERS</p><h2>Được yêu bởi hơn<br/><em>18.000</em> khách hàng</h2><div className="stars">★ ★ ★ ★ ★ <span>4.9/5</span></div></div>
        <div className="quotes">
          <blockquote><p>“Sản phẩm được gói rất đẹp, tư vấn kỹ và giao nhanh. Mình cảm nhận rõ sự chỉn chu của một boutique cao cấp.”</p><footer><b>MINH ANH</b><span>Khách hàng từ TP.HCM</span></footer></blockquote>
          <blockquote><p>“Mình yên tâm nhất ở nguồn gốc sản phẩm. Các set quà cũng rất tinh tế, không cần tự gói lại.”</p><footer><b>THU HÀ</b><span>Khách hàng thành viên</span></footer></blockquote>
        </div>
      </section>

      <section className="benefits">
        <div><b>◇</b><h3>Cam kết chính hãng</h3><p>Nguồn gốc minh bạch, kiểm định nghiêm ngặt.</p></div>
        <div><b>♧</b><h3>Tư vấn chuyên sâu</h3><p>Đội ngũ beauty advisor đồng hành cùng bạn.</p></div>
        <div><b>↻</b><h3>Đổi trả dễ dàng</h3><p>Hỗ trợ đổi trả trong vòng 7 ngày.</p></div>
        <div><b>♢</b><h3>Đóng gói tinh tế</h3><p>Mỗi đơn hàng là một món quà.</p></div>
      </section>

      <footer id="about">
        <div className="footer-brand"><a className="logo brand-logo" aria-label="THUYNGA Shop"><img src="/thuynga-logo.png" alt="THUYNGA Shop"/></a><p>Điểm đến mua sắm mỹ phẩm cao cấp, chính hãng dành cho người phụ nữ hiện đại.</p></div>
        <div><h4>KHÁM PHÁ</h4><a href="#deals">Sản phẩm mới</a><a href="#deals">Ưu đãi</a><a href="#brands">Thương hiệu</a><a href="#journal">Cẩm nang</a></div>
        <div><h4>HỖ TRỢ</h4><a href="#">Hướng dẫn mua hàng</a><a href="#">Vận chuyển</a><a href="#">Đổi trả & hoàn tiền</a><a href="#">Liên hệ</a></div>
        <div className="newsletter"><h4>THUYNGA LETTER</h4><p>Nhận câu chuyện làm đẹp và ưu đãi riêng.</p><label><input placeholder="Email của bạn"/><button>→</button></label></div>
      </footer>
      <div className="copyright">© 2026 THUYNGA SHOP <span>Facebook · Instagram · YouTube</span></div>

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
        <div className="checkout-top"><a className="logo brand-logo" aria-label="THUYNGA Shop"><img src="/thuynga-logo.png" alt="THUYNGA Shop"/></a><button onClick={() => {setCheckout(false); setOrdered(false)}}>×</button></div>
        {ordered ? <div className="success"><span>✓</span><p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p><h2>Cảm ơn bạn đã lựa chọn THUYNGA Shop.</h2><p>Mã đơn hàng <strong>#TNG260728</strong>. Xác nhận đơn hàng sẽ được gửi qua email và số điện thoại của bạn.</p><button onClick={() => {setCheckout(false);setOrdered(false)}}>TIẾP TỤC KHÁM PHÁ</button></div> :
        <form onSubmit={submitOrder} className="checkout-grid">
          <section className="checkout-form">
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
              <label className="method"><input type="radio" name="payment"/><span><b>Thẻ ATM / Visa / Mastercard</b><small>Kết nối cổng thanh toán khi đưa vào vận hành</small></span><i>VISA · MC</i></label>
              <label className="method"><input type="radio" name="payment"/><span><b>Chuyển khoản ngân hàng</b><small>Thông tin chuyển khoản gửi sau khi đặt hàng</small></span></label>
            </div>
            <button className="place-order" type="submit">HOÀN TẤT ĐẶT HÀNG · {format(subtotal + shipping)}</button>
            <p className="secure">⌾ Giao dịch được bảo vệ và mã hóa an toàn</p>
          </section>
          <aside className="order-summary">
            <h2>Đơn hàng của bạn</h2>
            {products.filter((p) => cart[p.id]).map((p) => <div className="summary-line" key={p.id}><div><img src={p.image} alt=""/><b>{cart[p.id]}</b></div><span><small>{p.brand}</small>{p.name}</span><strong>{format(p.price * cart[p.id])}</strong></div>)}
            <label className="voucher"><input placeholder="Mã ưu đãi"/><button type="button">ÁP DỤNG</button></label>
            <div className="totals"><p><span>Tạm tính</span><b>{format(subtotal)}</b></p><p><span>Vận chuyển</span><b>{shipping ? format(shipping) : "Miễn phí"}</b></p><p className="grand"><span>Tổng cộng</span><b>{format(subtotal + shipping)}</b></p></div>
          </aside>
        </form>}
      </div>}
    </main>
  );
}
