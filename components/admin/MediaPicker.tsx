"use client";

import { useEffect, useState } from "react";

export type Media = { id: number; storageKey: string | null; url: string; alt: string; mime: string; sizeBytes: number };

export default function MediaPicker({ selected, onChange, multiple = true }: { selected: number[]; onChange: (ids: number[]) => void; multiple?: boolean }) {
  const [items, setItems] = useState<Media[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => { const response = await fetch("/api/admin/media"); if (response.ok) setItems((await response.json()).media); };
  useEffect(() => { void load(); }, []);
  const upload = async (files: FileList | File[]) => {
    if (!files.length) return;
    setBusy(true); setMessage("");
    const form = new FormData(); for (const file of files) form.append("files", file);
    const response = await fetch("/api/admin/media/upload", { method: "POST", body: form });
    const data = await response.json();
    if (data.media?.length) { setItems((current) => [...current, ...data.media]); onChange(multiple ? [...selected, ...data.media.map((item: Media) => item.id)] : [data.media.at(-1).id]); }
    setMessage((data.errors ?? []).join("\n") || (!response.ok ? data.error : "Đã tải ảnh lên kho"));
    setBusy(false);
  };
  const addUrl = async () => {
    const response = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, alt: "" }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setItems((current) => [...current.filter((item) => item.id !== data.media.id), data.media]);
    onChange(multiple ? [...selected.filter((id) => id !== data.media.id), data.media.id] : [data.media.id]); setUrl(""); setMessage("Đã thêm ảnh từ URL");
  };
  const move = (index: number, delta: number) => { const next = [...selected]; const target = index + delta; if (target < 0 || target >= next.length) return; next.splice(target, 0, next.splice(index, 1)[0]); onChange(next); };
  const selectedItems = selected.map((id) => items.find((item) => item.id === id)).filter((item): item is Media => !!item);
  return <div className="media-picker">
    <div className="media-selected">{selectedItems.map((item, index) => <div className="media-tile" key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); move(Number(event.dataTransfer.getData("text/plain")), index - Number(event.dataTransfer.getData("text/plain"))); }}><img src={item.url} alt={item.alt}/><small>{index === 0 ? "Ảnh chính" : `Ảnh ${index + 1}`}</small><div><button type="button" onClick={() => move(index, -1)} aria-label="Đưa ảnh lên">←</button><button type="button" onClick={() => move(index, 1)} aria-label="Đưa ảnh xuống">→</button><button type="button" onClick={() => onChange(selected.filter((id) => id !== item.id))} aria-label="Gỡ ảnh khỏi sản phẩm">×</button></div><input aria-label={`Alt ảnh ${index + 1}`} defaultValue={item.alt} onBlur={async (event) => { const alt = event.target.value; await fetch(`/api/admin/media/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt }) }); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, alt } : entry)); }}/></div>)}</div>
    <button type="button" onClick={() => { void load(); setOpen(true); }}>＋ Thêm ảnh từ kho / tải lên</button>
    {open && <div className="media-overlay" onMouseDown={() => setOpen(false)}><section className="media-dialog" role="dialog" aria-modal="true" aria-label="Chọn ảnh" onMouseDown={(event) => event.stopPropagation()}><header><h2>Chọn ảnh</h2><button type="button" onClick={() => setOpen(false)} aria-label="Đóng">×</button></header><nav><button type="button" aria-pressed={tab === "library"} onClick={() => setTab("library")}>Kho ảnh</button><button type="button" aria-pressed={tab === "upload"} onClick={() => setTab("upload")}>Tải ảnh mới</button></nav>{tab === "library" ? <><input aria-label="Tìm ảnh" placeholder="Tìm theo alt hoặc URL" value={query} onChange={(event) => setQuery(event.target.value)}/><div className="media-library-grid">{items.filter((item) => `${item.alt} ${item.url}`.toLocaleLowerCase("vi-VN").includes(query.toLocaleLowerCase("vi-VN"))).map((item) => <button type="button" aria-pressed={selected.includes(item.id)} key={item.id} onClick={() => onChange(multiple ? selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id] : [item.id])}><img src={item.url} alt={item.alt}/><span>{item.alt || item.url.split("/").at(-1)}</span></button>)}</div></> : <><div className="media-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(Array.from(event.dataTransfer.files)); }}><p>Kéo ảnh vào đây hoặc chọn từ thiết bị</p><input aria-label="Chọn ảnh tải lên" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} onChange={(event) => { if (event.target.files) void upload(event.target.files); }}/></div><label>Dán link ảnh URL<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..."/></label><button type="button" disabled={!url} onClick={() => void addUrl()}>Thêm từ URL</button></>}{message && <p role="status">{message}</p>}<footer><button type="button" onClick={() => setOpen(false)} disabled={busy}>Xong ({selected.length} ảnh)</button></footer></section></div>}
  </div>;
}
