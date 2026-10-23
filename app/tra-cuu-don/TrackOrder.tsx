"use client";

import { useState } from "react";
import { formatPrice } from "@/catalog/products";

type Order = { code: string; status: string; total: number; paymentMethod: string; paymentStatus: string; items: { productName: string; variantName: string | null; quantity: number; price: number }[] };
const statuses = ["MOI", "DA_XAC_NHAN", "DANG_GIAO", "HOAN_THANH"];
const labels: Record<string, string> = { MOI: "Mới", DA_XAC_NHAN: "Đã xác nhận", DANG_GIAO: "Đang giao", HOAN_THANH: "Hoàn thành", HUY: "Đã hủy" };

export default function TrackOrder() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setOrder(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: form.get("code"), phone: form.get("phone") }) });
      const data = await response.json();
      if (!response.ok) setError(data.error ?? "Không tìm thấy đơn hàng phù hợp với thông tin đã nhập"); else setOrder(data.order);
    } catch { setError("Không thể tra cứu lúc này. Vui lòng thử lại."); }
    finally { setBusy(false); }
  };
  return <div className="track-order"><p className="eyebrow">HỖ TRỢ ĐƠN HÀNG</p><h1>Tra cứu đơn hàng</h1><form onSubmit={submit}><label>Mã đơn<input name="code" required placeholder="TNG-YYYYMMDD-XXXX" autoComplete="off"/></label><label>Số điện thoại đặt hàng<input name="phone" required inputMode="tel" placeholder="0901234567"/></label><button disabled={busy}>{busy ? "Đang tra cứu..." : "Tra cứu"}</button></form>{error && <p role="alert">{error}</p>}{order && <section role="status"><h2>Đơn {order.code}</h2><ol>{statuses.map((status) => <li key={status} className={statuses.indexOf(status) <= statuses.indexOf(order.status) ? "done" : ""}>{labels[status]}</li>)}{order.status === "HUY" && <li className="done">{labels.HUY}</li>}</ol><h3>Sản phẩm</h3>{order.items.map((item, index) => <p key={index}>{item.productName}{item.variantName && ` · ${item.variantName}`} × {item.quantity} — {formatPrice(item.price * item.quantity)}</p>)}<strong>Tổng tiền: {formatPrice(order.total)}</strong><p>Phương thức: {order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản ngân hàng"}</p><p>Thanh toán: {order.paymentStatus}</p></section>}</div>;
}
