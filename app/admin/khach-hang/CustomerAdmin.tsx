"use client";

import { useEffect, useState } from "react";
import "../admin-extra.css";

type Order = { id: number; code: string; total: number; status: string; createdAt: string };
type Customer = { id: string; name: string | null; email: string | null; phone: string; createdAt: string; orderCount: number; totalSpent: number; orders: Order[] };
const money = (value: number) => `${value.toLocaleString("vi-VN")}₫`;

export default function CustomerAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void fetch("/api/admin/customers").then((response) => response.json()).then((data) => { setCustomers(data.customers ?? []); setLoading(false); }); }, []);
  const filtered = customers.filter((item) => `${item.name} ${item.email} ${item.phone}`.toLocaleLowerCase("vi-VN").includes(search.toLocaleLowerCase("vi-VN")));
  return <div className="admin-extra"><div className="extra-heading"><label>Tìm khách hàng<input aria-label="Tìm khách hàng" placeholder="Tên, email hoặc số điện thoại" value={search} onChange={(event) => setSearch(event.target.value)}/></label><span>{filtered.length} khách hàng</span></div>{loading ? <p role="status">Đang tải…</p> : <div className="extra-table">{filtered.map((item) => <button className="extra-customer" key={item.id} onClick={() => setSelected(item)}><strong>{item.name || "Chưa có tên"}</strong><span>{item.email}</span><span>{item.phone || "Chưa có số điện thoại"}</span><span>Đăng ký {new Date(item.createdAt).toLocaleDateString("vi-VN")}</span><span>{item.orderCount} đơn</span><b>{money(item.totalSpent)}</b></button>)}{!filtered.length && <p>Không tìm thấy khách hàng.</p>}</div>}{selected && <div className="extra-overlay" onMouseDown={() => setSelected(null)}><section className="extra-dialog" role="dialog" aria-modal="true" aria-label="Chi tiết khách hàng" onMouseDown={(event) => event.stopPropagation()}><button className="extra-close" onClick={() => setSelected(null)} aria-label="Đóng">×</button><h2>{selected.name || selected.email}</h2><p>{selected.email} · {selected.phone || "Chưa có số điện thoại"}</p><p>Đăng ký {new Date(selected.createdAt).toLocaleDateString("vi-VN")} · {selected.orderCount} đơn · {money(selected.totalSpent)}</p><h3>Lịch sử đơn hàng</h3>{selected.orders.map((order) => <div className="extra-order" key={order.id}><b>{order.code}</b><span>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span><span>{order.status}</span><strong>{money(order.total)}</strong></div>)}{!selected.orders.length && <p>Chưa có đơn hàng.</p>}</section></div>}</div>;
}
