"use client";

import { useMemo, useState } from "react";
import { Input } from "./ui";

type Hit = { label: string; detail: string; href: string };

export default function CommandPalette({ pages, catalog, onNavigate, onClose }: { pages: Hit[]; catalog: { products: { id: number; name: string; slug: string }[]; orders: { code: string }[] } | null; onNavigate: (href: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const hits = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi-VN");
    const products = (catalog?.products ?? []).map((item) => ({ label: item.name, detail: `Sản phẩm · ${item.slug}`, href: `/admin?view=products&edit=${item.id}` }));
    const orders = (catalog?.orders ?? []).map((item) => ({ label: item.code, detail: "Đơn hàng", href: `/admin?view=orders&order=${encodeURIComponent(item.code)}` }));
    return [...pages, ...products, ...orders].filter((hit) => !needle || `${hit.label} ${hit.detail}`.toLocaleLowerCase("vi-VN").includes(needle)).slice(0, 12);
  }, [query, catalog, pages]);
  return <div className="admin-command-back" onMouseDown={onClose}><section className="admin-command" role="dialog" aria-modal="true" aria-label="Tìm nhanh toàn cục" onMouseDown={(event) => event.stopPropagation()}><Input autoFocus aria-label="Tìm trang, sản phẩm hoặc đơn hàng" placeholder="Tìm trang, sản phẩm hoặc mã đơn…" value={query} onChange={(event) => { setQuery(event.target.value); setSelected(0); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setSelected((index) => Math.min(index + 1, hits.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setSelected((index) => Math.max(index - 1, 0)); } if (event.key === "Enter" && hits[selected]) onNavigate(hits[selected].href); }}/><div role="listbox">{hits.map((hit, index) => <button type="button" role="option" aria-selected={index === selected} key={`${hit.href}-${index}`} onMouseEnter={() => setSelected(index)} onClick={() => onNavigate(hit.href)}><span>{hit.label}</span><small>{hit.detail}</small></button>)}{hits.length === 0 && <p>Không tìm thấy kết quả.</p>}</div><p>↑ ↓ để chọn · Enter để mở · Esc để đóng</p></section></div>;
}
