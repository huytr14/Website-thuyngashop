"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/catalog/products";
import { formatPrice as format } from "@/catalog/products";
import { CART_STORAGE_KEY, parseCart } from "@/lib/cart";
import { shippingFee } from "@/lib/commerce";
import type { SiteContent } from "@/lib/site-content";

type Settings = { freeShippingThreshold: number; standardShippingFee: number; bankName: string; bankAccountName: string; bankAccountNumber: string; vietQrUrl: string };
type Quote = { subtotal: number; shipping: number; discount: number; total: number; voucherCode: string };

export default function CheckoutPage({ products, settings, site }: { products: Product[]; settings: Settings; site: SiteContent }) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [payment, setPayment] = useState<"COD" | "BANK_TRANSFER">("COD");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<{ code: string; total: number; paymentMethod: string } | null>(null);
  const idempotencyKey = useRef("");

  useEffect(() => { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY))); setLoaded(true); }, []);
  const lines = useMemo(() => products.filter(({ id }) => cart[id]), [cart, products]);
  const subtotal = lines.reduce((sum, product) => sum + product.price * cart[product.id], 0);
  const currentQuote = quote ?? { subtotal, shipping: subtotal ? shippingFee(subtotal, settings.freeShippingThreshold, settings.standardShippingFee) : 0, discount: 0, total: subtotal + (subtotal ? shippingFee(subtotal, settings.freeShippingThreshold, settings.standardShippingFee) : 0), voucherCode: "" };
  const items = lines.map(({ id }) => ({ productId: id, quantity: cart[id] }));

  const applyVoucher = async () => {
    setVoucherMessage("");
    const response = await fetch("/api/checkout/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, voucherCode }) });
    const data = await response.json();
    if (!response.ok) { setQuote(null); setVoucherMessage(data.error ?? "Không thể kiểm tra mã"); return; }
    setQuote(data);
    setVoucherMessage(data.voucherCode ? `Đã áp dụng mã ${data.voucherCode}` : "Đã cập nhật tổng tiền");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
      body: JSON.stringify({
        customerName: form.get("customerName"), email: form.get("email"), phone: form.get("phone"),
        address: form.get("address"), city: form.get("city"), district: form.get("district"), note: form.get("note"),
        paymentMethod: payment, voucherCode, items,
      }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Không thể tạo đơn hàng"); setSending(false); return; }
    localStorage.removeItem(CART_STORAGE_KEY);
    setOrder(data.order);
    setSending(false);
  };

  if (order) return <main className="checkout checkout-page"><div className="checkout-top"><a href="/" className="logo brand-logo"><img src={site.brand.logo} alt={site.brand.name}/></a></div><div className="success"><span>✓</span><p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p><h1>Cảm ơn bạn đã đặt hàng.</h1><p>Mã đơn của bạn là <strong>{order.code}</strong>. Tổng thanh toán {format(order.total)}.</p>{order.paymentMethod === "BANK_TRANSFER" && <p>Vui lòng chuyển khoản với nội dung <strong>{order.code}</strong>.</p>}<a className="place-order success-link" href="/">TIẾP TỤC MUA SẮM</a></div></main>;
  if (loaded && !lines.length) return <main className="checkout checkout-page"><div className="checkout-top"><a href="/" className="logo brand-logo"><img src={site.brand.logo} alt={site.brand.name}/></a></div><div className="success"><span>◇</span><h1>Túi hàng đang trống.</h1><a className="place-order success-link" href="/">QUAY LẠI CỬA HÀNG</a></div></main>;

  return <main className="checkout checkout-page">
    <div className="checkout-top"><a href="/" className="logo brand-logo" aria-label={site.brand.name}><img src={site.brand.logo} alt={site.brand.name}/></a><a href="/">×</a></div>
    <form onSubmit={submit} className="checkout-grid">
      <section className="checkout-form">
        <div className="checkout-steps"><b>1 Thông tin</b><span>2 Vận chuyển</span><span>3 Thanh toán</span></div>
        <h2>Thông tin giao hàng</h2>
        <div className="field-grid">
          <label className="full"><span>Email</span><input name="email" type="email" required maxLength={255} placeholder="hello@example.com"/></label>
          <label><span>Họ và tên</span><input name="customerName" required minLength={2} maxLength={150} placeholder="Nguyễn Minh Anh"/></label>
          <label><span>Số điện thoại</span><input name="phone" required inputMode="numeric" pattern="0[0-9]{8,10}" placeholder="0901234567"/></label>
          <label className="full"><span>Địa chỉ</span><input name="address" required minLength={5} maxLength={500} placeholder="Số nhà, tên đường"/></label>
          <label><span>Tỉnh / Thành phố</span><input name="city" required maxLength={100} placeholder="TP. Hồ Chí Minh"/></label>
          <label><span>Quận / Huyện</span><input name="district" required maxLength={100} placeholder="Quận / Huyện"/></label>
          <label className="full"><span>Ghi chú (không bắt buộc)</span><textarea name="note" maxLength={1000}/></label>
        </div>
        <h2>Phương thức vận chuyển</h2>
        <label className="method selected"><input type="radio" checked readOnly/><span><b>Giao hàng tiêu chuẩn</b><small>2–4 ngày làm việc</small></span><strong>{currentQuote.shipping ? format(currentQuote.shipping) : "MIỄN PHÍ"}</strong></label>
        <h2>Phương thức thanh toán</h2>
        <div className="payment-methods">
          <label className="method"><input type="radio" name="payment" checked={payment === "COD"} onChange={() => setPayment("COD")}/><span><b>Thanh toán khi nhận hàng (COD)</b><small>Thanh toán tiền mặt cho đơn vị vận chuyển</small></span></label>
          <label className="method"><input type="radio" name="payment" checked={payment === "BANK_TRANSFER"} onChange={() => setPayment("BANK_TRANSFER")}/><span><b>Chuyển khoản ngân hàng</b><small>Chuyển khoản theo mã đơn sau khi đặt hàng</small></span></label>
        </div>
        {payment === "BANK_TRANSFER" && <div className="bank-details">{settings.bankAccountNumber ? <><p><b>{settings.bankName}</b></p><p>STK: <strong>{settings.bankAccountNumber}</strong></p><p>Chủ tài khoản: <strong>{settings.bankAccountName}</strong></p>{settings.vietQrUrl && <img src={settings.vietQrUrl} alt="Mã QR VietQR của THUYNGA Shop"/>}</> : <p>Thông tin chuyển khoản đang được cập nhật.</p>}</div>}
        {error && <p className="checkout-error">{error}</p>}
        <button className="place-order" type="submit" disabled={sending || !loaded}>{sending ? "ĐANG TẠO ĐƠN..." : `ĐẶT HÀNG · ${format(currentQuote.total)}`}</button>
        <p className="secure">Giá và ưu đãi được kiểm tra lại trên máy chủ trước khi tạo đơn.</p>
      </section>
      <aside className="order-summary">
        <h2>Đơn hàng của bạn</h2>
        {lines.map((product) => <div className="summary-line" key={product.id}><div><img src={product.image} alt=""/><b>{cart[product.id]}</b></div><span><small>{product.brand}</small>{product.name}</span><strong>{format(product.price * cart[product.id])}</strong></div>)}
        <div className="voucher"><input value={voucherCode} onChange={(event) => { setVoucherCode(event.target.value.toUpperCase()); setQuote(null); }} maxLength={50} placeholder="Mã giảm giá"/><button type="button" onClick={() => void applyVoucher()}>ÁP DỤNG</button></div>
        {voucherMessage && <p className="voucher-message">{voucherMessage}</p>}
        <div className="totals"><p><span>Tạm tính</span><b>{format(currentQuote.subtotal)}</b></p><p><span>Vận chuyển</span><b>{currentQuote.shipping ? format(currentQuote.shipping) : "Miễn phí"}</b></p>{currentQuote.discount > 0 && <p><span>Giảm giá</span><b>−{format(currentQuote.discount)}</b></p>}<p className="grand"><span>Tổng cộng</span><b>{format(currentQuote.total)}</b></p></div>
      </aside>
    </form>
  </main>;
}
