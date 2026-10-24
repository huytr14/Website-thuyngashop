"use client";

import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import "./ui.css";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export function Button({ variant = "secondary", className = "", ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button data-admin-button={variant} className={className} {...props}/>;
}
export function Input({ className = "", ...props }: ComponentProps<"input">) { return <input data-admin-input className={className} {...props}/>; }
export function Select({ className = "", ...props }: ComponentProps<"select">) { return <select data-admin-input className={className} {...props}/>; }
export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) { return <textarea data-admin-input className={className} {...props}/>; }
export function Switch({ label, ...props }: Omit<ComponentProps<"input">, "type"> & { label: string }) { return <label className="admin-ui-switch"><input type="checkbox" role="switch" {...props}/><span>{label}</span></label>; }
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "info" | "success" | "warning" | "danger" }) { return <span className="admin-ui-badge" data-tone={tone}>{children}</span>; }
export function Spinner() { return <span className="admin-ui-spinner" role="status" aria-label="Đang xử lý"/>; }
export function Skeleton({ rows = 5 }: { rows?: number }) { return <div className="admin-ui-skeleton" role="status" aria-label="Đang tải dữ liệu">{Array.from({ length: rows }, (_, index) => <div key={index}/>)}</div>; }
export function EmptyState({ title, action }: { title: string; action?: ReactNode }) { return <div className="admin-ui-empty"><p>{title}</p>{action}</div>; }
export function Table({ children }: { children: ReactNode }) { return <div className="admin-ui-table-wrap"><table className="admin-ui-table">{children}</table></div>; }
export function DataTable<T>({ rows, columns, keyOf, loading, error, onRetry, empty = "Chưa có dữ liệu.", toolbar, selected, onSelected, bulkActions }: { rows: T[]; columns: { key: string; label: string; cell: (row: T) => ReactNode; sort?: (row: T) => string | number }[]; keyOf: (row: T) => string | number; loading?: boolean; error?: string; onRetry?: () => void; empty?: string; toolbar?: ReactNode; selected?: (string | number)[]; onSelected?: (ids: (string | number)[]) => void; bulkActions?: ReactNode }) {
  const [sort, setSort] = useState("");
  const [descending, setDescending] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows.length, sort, descending]);
  const order = columns.find((column) => column.key === sort)?.sort;
  const sorted = order ? [...rows].sort((a, b) => { const first = order(a), second = order(b); return (typeof first === "number" && typeof second === "number" ? first - second : String(first).localeCompare(String(second), "vi-VN")) * (descending ? -1 : 1); }) : rows;
  const visible = sorted.slice(page * 20, (page + 1) * 20);
  return <div className="admin-ui-data-table">{toolbar && <div className="admin-ui-table-toolbar">{toolbar}</div>}{selected?.length ? <div className="admin-ui-bulk"><strong>Đã chọn {selected.length}</strong>{bulkActions}</div> : null}{error ? <EmptyState title={error} action={onRetry && <Button onClick={onRetry}>Thử lại</Button>}/> : loading ? <Skeleton/> : rows.length ? <Table><thead><tr>{onSelected && <th><input type="checkbox" aria-label="Chọn tất cả trang này" checked={visible.length > 0 && visible.every((row) => selected?.includes(keyOf(row)))} onChange={(event) => onSelected(event.target.checked ? [...new Set([...(selected ?? []), ...visible.map(keyOf)])] : (selected ?? []).filter((id) => !visible.some((row) => keyOf(row) === id)))}/></th>}{columns.map((column) => <th key={column.key}>{column.sort ? <button type="button" onClick={() => { setDescending(sort === column.key ? !descending : false); setSort(column.key); }}>{column.label}{sort === column.key ? descending ? " ↓" : " ↑" : " ↕"}</button> : column.label}</th>)}</tr></thead><tbody>{visible.map((row) => <tr key={keyOf(row)}>{onSelected && <td><input type="checkbox" aria-label={`Chọn dòng ${keyOf(row)}`} checked={selected?.includes(keyOf(row)) ?? false} onChange={(event) => onSelected(event.target.checked ? [...(selected ?? []), keyOf(row)] : (selected ?? []).filter((id) => id !== keyOf(row)))}/></td>}{columns.map((column) => <td key={column.key}>{column.cell(row)}</td>)}</tr>)}</tbody></Table> : <EmptyState title={empty}/>}{rows.length > 20 && <div className="admin-ui-pages"><Button disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page + 1}/{Math.ceil(rows.length / 20)}</span><Button disabled={(page + 1) * 20 >= rows.length} onClick={() => setPage(page + 1)}>Sau</Button></div>}</div>;
}

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open && !ref.current?.open) ref.current?.showModal(); if (!open && ref.current?.open) ref.current.close(); }, [open]);
  return <dialog ref={ref} className="admin-ui-dialog" onClose={onClose} onCancel={onClose} aria-label={title}><h2>{title}</h2>{children}</dialog>;
}

type Toast = { message: string; tone: "success" | "error"; undo?: () => void };
const ToastContext = createContext<(message: string, tone?: Toast["tone"], undo?: () => void) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 4000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const listener = (event: Event) => { const { message, tone } = (event as CustomEvent<Toast>).detail; setToast({ message, tone }); }; window.addEventListener("admin-toast", listener); return () => window.removeEventListener("admin-toast", listener); }, []);
  return <ToastContext.Provider value={(message, tone = "success", undo) => setToast({ message, tone, undo })}>{children}{toast && <div className="admin-ui-toast" data-tone={toast.tone} role="status">{toast.message}{toast.undo && <Button variant="ghost" onClick={() => { toast.undo?.(); setToast(null); }}>Hoàn tác</Button>}<button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>×</button></div>}</ToastContext.Provider>;
}
export const useAdminToast = () => useContext(ToastContext);

export function StickySaveBar({ dirty, saving, onSave, onUndo, saveText = "Lưu" }: { dirty: boolean; saving?: boolean; onSave: () => void; onUndo: () => void; saveText?: string }) {
  if (!dirty) return null;
  return <div className="admin-ui-save-bar"><span>Có thay đổi chưa lưu</span><div><Button type="button" onClick={onUndo}>Hoàn tác</Button><Button type="button" variant="primary" disabled={saving} onClick={onSave}>{saving ? "Đang lưu…" : saveText}</Button></div></div>;
}
