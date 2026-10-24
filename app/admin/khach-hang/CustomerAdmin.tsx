"use client";

import { useEffect, useState } from "react";
import { Button, DataTable, Dialog, Input } from "@/components/admin/ui";
import "../admin-extra.css";

type Order = { id: number; code: string; total: number; status: string; createdAt: string };
type Customer = { id: string; name: string | null; email: string | null; phone: string; createdAt: string; orderCount: number; totalSpent: number; orders: Order[] };
const money = (value: number) => `${value.toLocaleString("vi-VN")}₫`;

export default function CustomerAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); try { const response = await fetch("/api/admin/customers"); if (!response.ok) throw new Error(); setCustomers((await response.json()).customers ?? []); setError(""); } catch { setError("Không thể tải khách hàng."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const filtered = customers.filter((item) => `${item.name} ${item.email} ${item.phone}`.toLocaleLowerCase("vi-VN").includes(search.toLocaleLowerCase("vi-VN")));
  return <div className="admin-extra"><DataTable rows={filtered} keyOf={(item) => item.id} loading={loading} error={error} onRetry={() => void load()} empty="Không tìm thấy khách hàng." toolbar={<><label>Tìm khách hàng <Input aria-label="Tìm khách hàng" placeholder="Tên, email hoặc số điện thoại" value={search} onChange={(event) => setSearch(event.target.value)}/></label><span>{filtered.length} khách hàng</span></>} columns={[
    { key: "name", label: "Khách hàng", sort: (item) => item.name ?? "", cell: (item) => <Button variant="ghost" onClick={() => setSelected(item)}>{item.name || "Chưa có tên"}</Button> },
    { key: "email", label: "Email", cell: (item) => item.email },
    { key: "phone", label: "Điện thoại", cell: (item) => item.phone || "Chưa có số điện thoại" },
    { key: "orders", label: "Đơn", sort: (item) => item.orderCount, cell: (item) => item.orderCount },
    { key: "spent", label: "Đã mua", sort: (item) => item.totalSpent, cell: (item) => money(item.totalSpent) },
  ]}/><Dialog open={!!selected} title="Chi tiết khách hàng" onClose={() => setSelected(null)}><h3>{selected?.name || selected?.email}</h3><p>{selected?.email} · {selected?.phone || "Chưa có số điện thoại"}</p><p>{selected?.orderCount} đơn · {money(selected?.totalSpent ?? 0)}</p><h3>Lịch sử đơn hàng</h3>{selected?.orders.map((order) => <div className="extra-order" key={order.id}><b>{order.code}</b><span>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span><span>{order.status}</span><strong>{money(order.total)}</strong></div>)}{!selected?.orders.length && <p>Chưa có đơn hàng.</p>}</Dialog></div>;
}
