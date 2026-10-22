"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.css";

type Review = { id: number; rating: number; title: string; content: string; status: string; customerName: string | null; productName: string };

export default function ReviewAdmin() { const [reviews, setReviews] = useState<Review[]>([]); const load = async () => { const response = await fetch("/api/admin/reviews"); const data = await response.json(); setReviews(data.reviews ?? []); }; useEffect(() => { void load(); }, []); const update = async (id: number, status: "APPROVED" | "REJECTED") => { const response = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (response.ok) setReviews((items) => items.map((item) => item.id === id ? { ...item, status } : item)); }; return <section className={styles.panel}>{reviews.map((review) => <article className={styles.reviewRow} key={review.id}><div><b>{"★".repeat(review.rating)} {review.title}</b><small>{review.productName} · {review.customerName ?? "Khách hàng"} · {review.status}</small><p>{review.content}</p></div><span><button className={styles.primary} onClick={() => void update(review.id, "APPROVED")}>Duyệt</button><button onClick={() => void update(review.id, "REJECTED")}>Ẩn</button></span></article>)}{!reviews.length && <div className={styles.empty}>Chưa có đánh giá.</div>}</section>; }
