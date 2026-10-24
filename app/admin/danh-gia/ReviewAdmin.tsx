"use client";

import { useEffect, useState } from "react";
import { Badge, Button, DataTable, Dialog, Input, Select, Textarea } from "@/components/admin/ui";
import styles from "../admin.module.css";

type Review = { id: number; rating: number; title: string; content: string; status: string; shopReply: string | null; customerName: string | null; productName: string };

export default function ReviewAdmin() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const load = async () => { setLoading(true); try { const response = await fetch("/api/admin/reviews"); if (!response.ok) throw new Error(); setReviews((await response.json()).reviews ?? []); setError(""); } catch { setError("Không thể tải đánh giá."); } finally { setLoading(false); } };
  useEffect(() => { setFilter(new URLSearchParams(location.search).get("status") ?? "PENDING"); void load(); }, []);
  const update = async (id: number, data: { status?: "APPROVED" | "REJECTED"; shopReply?: string | null }) => {
    try { const response = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Không thể cập nhật đánh giá"); setReviews((items) => items.map((item) => item.id === id ? { ...item, ...body.review } : item)); setError(""); window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "Đã cập nhật đánh giá", tone: "success" } })); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể cập nhật đánh giá"); }
  };
  const remove = async (id: number) => { const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" }); if (response.ok) setReviews((items) => items.filter((item) => item.id !== id)); else setError("Không thể xóa đánh giá"); };
  const filtered = reviews.filter((item) => (filter === "ALL" || item.status === filter) && `${item.title} ${item.productName} ${item.customerName}`.toLocaleLowerCase("vi-VN").includes(query.toLocaleLowerCase("vi-VN")));
  return <section className={styles.panel}><DataTable rows={filtered} keyOf={(item) => item.id} loading={loading} error={error} onRetry={() => void load()} empty="Không có đánh giá ở bộ lọc này." toolbar={<><Input aria-label="Tìm đánh giá" placeholder="Tìm đánh giá" value={query} onChange={(event) => setQuery(event.target.value)}/><label>Trạng thái <Select aria-label="Lọc đánh giá" value={filter} onChange={(event) => { setFilter(event.target.value); const params = new URLSearchParams(location.search); params.set("status", event.target.value); history.replaceState(null, "", `${location.pathname}?${params}`); }}><option value="ALL">Tất cả</option><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Đã ẩn</option></Select></label></>} columns={[
    { key: "title", label: "Đánh giá", sort: (item) => item.title, cell: (item) => <div><b>{"★".repeat(item.rating)} {item.title}</b><p>{item.content}</p>{item.status === "APPROVED" && <label>Phản hồi của shop<Textarea aria-label={`Phản hồi đánh giá ${item.id}`} rows={3} defaultValue={item.shopReply ?? ""} onBlur={(event) => { if (event.target.value.trim() !== (item.shopReply ?? "")) void update(item.id, { shopReply: event.target.value.trim() || null }); }}/></label>}</div> },
    { key: "product", label: "Sản phẩm / Khách", sort: (item) => item.productName, cell: (item) => `${item.productName} · ${item.customerName ?? "Khách hàng"}` },
    { key: "status", label: "Trạng thái", sort: (item) => item.status, cell: (item) => <Badge tone={item.status === "APPROVED" ? "success" : item.status === "PENDING" ? "warning" : "neutral"}>{item.status === "APPROVED" ? "Đã duyệt" : item.status === "PENDING" ? "Chờ duyệt" : "Đã ẩn"}</Badge> },
    { key: "actions", label: "Thao tác", cell: (item) => <span className="admin-row-menu"><Button aria-label={`Hành động đánh giá ${item.id}`} onClick={() => setMenu(menu === item.id ? null : item.id)}>⋯</Button>{menu === item.id && <div role="menu">{item.status !== "APPROVED" && <button role="menuitem" onClick={() => { setMenu(null); void update(item.id, { status: "APPROVED" }); }}>Duyệt</button>}{item.status !== "REJECTED" && <button role="menuitem" onClick={() => { setMenu(null); void update(item.id, { status: "REJECTED" }); }}>Ẩn</button>}<button role="menuitem" onClick={() => { setMenu(null); setDeleting(item.id); }}>Xóa</button></div>}</span> },
  ]}/><Dialog open={deleting !== null} title="Xóa đánh giá?" onClose={() => setDeleting(null)}><p>Đánh giá sẽ bị xóa vĩnh viễn.</p><div className="admin-ui-dialog-actions"><Button onClick={() => setDeleting(null)}>Quay lại</Button><Button variant="danger" onClick={() => { const id = deleting; setDeleting(null); if (id !== null) void remove(id); }}>Xóa</Button></div></Dialog></section>;
}
