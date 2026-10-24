"use client";

import { useEffect, useState } from "react";
import { Badge, Button, DataTable, Dialog, Input, Select, StickySaveBar } from "@/components/admin/ui";
import "../admin-extra.css";

type Voucher = { id?: number; code: string; type: "PERCENT" | "FIXED" | "FREESHIP"; value: number; minOrder: number; startsAt: string | null; expiresAt: string | null; usageLimit: number | null; perCustomerLimit: number | null; usedCount: number; active: boolean };
const empty = (): Voucher => ({ code: "", type: "PERCENT", value: 10, minOrder: 0, startsAt: null, expiresAt: null, usageLimit: null, perCustomerLimit: null, usedCount: 0, active: true });
const money = (value: number) => `${value.toLocaleString("vi-VN")}₫`;
const dateInput = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";

export default function VoucherAdmin() {
  const [items, setItems] = useState<Voucher[]>([]);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [initial, setInitial] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Voucher | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [menu, setMenu] = useState<number | null>(null);
  const dirty = !!editing && JSON.stringify(editing) !== initial;
  useEffect(() => { const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", beforeUnload); return () => window.removeEventListener("beforeunload", beforeUnload); }, [dirty]);
  const load = async () => { setLoading(true); try { const response = await fetch("/api/admin/vouchers"); if (!response.ok) throw new Error(); setItems((await response.json()).vouchers ?? []); setError(""); } catch { setError("Không thể tải mã giảm giá."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const open = (item: Voucher) => { setEditing(item); setInitial(JSON.stringify(item)); setError(""); setMessage(""); };
  const change = <K extends keyof Voucher>(key: K, value: Voucher[K]) => setEditing((item) => item ? { ...item, [key]: value } : item);
  const save = async () => {
    if (!editing) return;
    const response = await fetch(editing.id ? `/api/admin/vouchers/${editing.id}` : "/api/admin/vouchers", { method: editing.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editing, code: editing.code.toUpperCase(), startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : null, expiresAt: editing.expiresAt ? new Date(editing.expiresAt).toISOString() : null }) });
    const data = await response.json(); if (!response.ok) return setError(data.error ?? "Không thể lưu mã"); await load(); setEditing(null); setMessage("Đã lưu mã giảm giá."); window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "Đã lưu mã giảm giá", tone: "success" } }));
  };
  const remove = async (item: Voucher) => { const response = await fetch(`/api/admin/vouchers/${item.id}`, { method: "DELETE" }); if (response.ok) await load(); else setError("Không thể xóa mã"); };
  const toggle = async (item: Voucher) => { const response = await fetch(`/api/admin/vouchers/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, active: !item.active }) }); if (response.ok) await load(); else setError("Không thể đổi trạng thái"); };
  const filtered = items.filter((item) => item.code.toLowerCase().includes(query.trim().toLowerCase()) && (filter === "ALL" || (filter === "ACTIVE" ? item.active && (!item.expiresAt || new Date(item.expiresAt) > new Date()) : !item.active || !!item.expiresAt && new Date(item.expiresAt) <= new Date())));
  return <div className="admin-extra"><div className="extra-heading"><p>{items.length} mã giảm giá</p><Button variant="primary" onClick={() => open(empty())}>＋ Tạo mã giảm giá</Button></div>{message && <p role="status">{message}</p>}<DataTable rows={filtered} keyOf={(item) => item.id!} loading={loading} error={!editing ? error : ""} onRetry={() => void load()} empty="Chưa có mã giảm giá." toolbar={<><Input aria-label="Tra cứu voucher" placeholder="Tìm theo mã" value={query} onChange={(event) => setQuery(event.target.value)}/><Select aria-label="Lọc mã giảm giá" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Tất cả</option><option value="ACTIVE">Còn hạn</option><option value="EXPIRED">Hết hạn / tắt</option></Select></>} columns={[
    { key: "code", label: "Mã", sort: (item) => item.code, cell: (item) => <strong>{item.code}</strong> },
    { key: "value", label: "Giá trị", sort: (item) => item.value, cell: (item) => item.type === "PERCENT" ? `${item.value}%` : item.type === "FIXED" ? money(item.value) : "Miễn phí ship" },
    { key: "min", label: "Đơn tối thiểu", sort: (item) => item.minOrder, cell: (item) => money(item.minOrder) },
    { key: "usage", label: "Đã dùng", sort: (item) => item.usedCount, cell: (item) => `${item.usedCount}/${item.usageLimit ?? "∞"}` },
    { key: "status", label: "Trạng thái", cell: (item) => <Badge tone={item.active && (!item.expiresAt || new Date(item.expiresAt) > new Date()) ? "success" : "neutral"}>{item.active && (!item.expiresAt || new Date(item.expiresAt) > new Date()) ? "Còn hạn" : "Hết hạn / tắt"}</Badge> },
    { key: "actions", label: "Thao tác", cell: (item) => <span className="admin-row-menu"><Button aria-label={`Hành động mã ${item.code}`} onClick={() => setMenu(menu === item.id ? null : item.id!)}>⋯</Button>{menu === item.id && <div role="menu"><button role="menuitem" onClick={() => { setMenu(null); open(item); }}>Sửa</button><button role="menuitem" onClick={() => { setMenu(null); void toggle(item); }}>{item.active ? "Tắt" : "Bật"}</button><button role="menuitem" onClick={() => { setMenu(null); setDeleting(item); }}>Xóa</button></div>}</span> },
  ]}/>
    {editing && <div className="extra-overlay" onMouseDown={() => { if (!dirty || confirm("Bỏ thay đổi chưa lưu?")) setEditing(null); }}><section className="extra-dialog" role="dialog" aria-modal="true" aria-label="Sửa mã giảm giá" onMouseDown={(event) => event.stopPropagation()}>{error && <p role="alert" className="extra-error">{error}</p>}<h2>{editing.id ? `Sửa mã ${editing.code}` : "Tạo mã giảm giá"}</h2><div className="extra-fields"><label>Mã<input aria-label="Mã giảm giá" value={editing.code} onChange={(event) => change("code", event.target.value.toUpperCase())}/></label><label>Loại<select value={editing.type} onChange={(event) => change("type", event.target.value as Voucher["type"])}><option value="PERCENT">Giảm %</option><option value="FIXED">Số tiền cố định</option><option value="FREESHIP">Miễn phí ship</option></select></label>{editing.type !== "FREESHIP" && <label>Giá trị<input type="number" min="1" value={editing.value} onChange={(event) => change("value", Number(event.target.value))}/></label>}<label>Đơn tối thiểu<input type="number" min="0" value={editing.minOrder} onChange={(event) => change("minOrder", Number(event.target.value))}/></label><label>Giới hạn tổng lượt dùng<input type="number" min="1" placeholder="Không giới hạn" value={editing.usageLimit ?? ""} onChange={(event) => change("usageLimit", event.target.value ? Number(event.target.value) : null)}/></label><label>Lượt mỗi người<input type="number" min="1" placeholder="Không giới hạn" value={editing.perCustomerLimit ?? ""} onChange={(event) => change("perCustomerLimit", event.target.value ? Number(event.target.value) : null)}/></label><label>Ngày bắt đầu<input type="datetime-local" value={dateInput(editing.startsAt)} onChange={(event) => change("startsAt", event.target.value || null)}/></label><label>Ngày kết thúc<input type="datetime-local" value={dateInput(editing.expiresAt)} onChange={(event) => change("expiresAt", event.target.value || null)}/></label><label className="extra-check"><input type="checkbox" checked={editing.active} onChange={(event) => change("active", event.target.checked)}/> Đang bật</label></div><StickySaveBar dirty={dirty} onUndo={() => setEditing(JSON.parse(initial) as Voucher)} onSave={() => void save()} saveText="Lưu mã"/></section></div>}
    <Dialog open={!!deleting} title={`Xóa mã ${deleting?.code ?? ""}?`} onClose={() => setDeleting(null)}><p>Mã giảm giá này sẽ bị xóa vĩnh viễn.</p><div className="admin-ui-dialog-actions"><Button onClick={() => setDeleting(null)}>Quay lại</Button><Button variant="danger" onClick={() => { const item = deleting; setDeleting(null); if (item) void remove(item); }}>Xóa mã</Button></div></Dialog>
  </div>;
}
