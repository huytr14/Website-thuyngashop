"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.css";

type Review = { id: number; rating: number; title: string; content: string; status: string; shopReply: string | null; customerName: string | null; productName: string };

export default function ReviewAdmin() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/admin/reviews").then((response) => response.json()).then((data) => setReviews(data.reviews ?? [])); }, []);
  const update = async (id: number, data: { status?: "APPROVED" | "REJECTED"; shopReply?: string | null }) => {
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Không thể cập nhật đánh giá");
    setReviews((items) => items.map((item) => item.id === id ? { ...item, ...body.review } : item)); setError("");
  };
  const remove = async (id: number) => {
    if (!confirm("Xóa vĩnh viễn đánh giá này?")) return;
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (response.ok) setReviews((items) => items.filter((item) => item.id !== id)); else setError("Không thể xóa đánh giá");
  };
  return <section className={styles.panel}><div className={styles.toolbar}><label>Trạng thái <select aria-label="Lọc đánh giá" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Đã ẩn</option></select></label></div>{error && <p role="alert">{error}</p>}{reviews.filter((review) => review.status === filter).map((review) => <article className={styles.reviewRow} key={review.id}><div><b>{"★".repeat(review.rating)} {review.title}</b><small>{review.productName} · {review.customerName ?? "Khách hàng"}</small><p>{review.content}</p>{review.status === "APPROVED" && <label>Phản hồi của shop<textarea aria-label={`Phản hồi đánh giá ${review.id}`} rows={3} defaultValue={review.shopReply ?? ""} onBlur={(event) => { if (event.target.value.trim() !== (review.shopReply ?? "")) void update(review.id, { shopReply: event.target.value.trim() || null }); }}/></label>}</div><span>{review.status !== "APPROVED" && <button className={styles.primary} onClick={() => void update(review.id, { status: "APPROVED" })}>{review.status === "REJECTED" ? "Hiện lại" : "Duyệt"}</button>}{review.status !== "REJECTED" && <button onClick={() => void update(review.id, { status: "REJECTED" })}>Ẩn</button>}<button onClick={() => void remove(review.id)}>Xóa</button></span></article>)}{!reviews.some((review) => review.status === filter) && <div className={styles.empty}>Không có đánh giá ở trạng thái này.</div>}</section>;
}
