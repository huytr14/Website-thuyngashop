"use client";

import { useEffect, useState } from "react";
import { formatPrice, type Product } from "@/catalog/products";

const key = "thuynga-recent-products";
type Viewed = { id: number; at: number };

export default function RecentProducts({ products, currentId }: { products: Product[]; currentId?: number }) {
  const [viewed, setViewed] = useState<Viewed[]>([]);
  useEffect(() => {
    let previous: Viewed[] = [];
    try { const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]"); if (Array.isArray(parsed)) previous = parsed.filter((item): item is Viewed => typeof item?.id === "number" && typeof item?.at === "number").slice(0, 12); } catch { /* Ignore invalid local data. */ }
    if (currentId) {
      const next = [{ id: currentId, at: Date.now() }, ...previous.filter((item) => item.id !== currentId)].slice(0, 12);
      localStorage.setItem(key, JSON.stringify(next));
      setViewed(next);
    } else setViewed(previous);
  }, [currentId]);
  const recent = viewed.filter((item) => item.id !== currentId).map((item) => products.find((product) => product.id === item.id)).filter((item): item is Product => !!item);
  if (!recent.length) return null;
  return <section className="recent-products section"><div className="section-heading"><div><span className="section-overline">DÀNH CHO BẠN</span><h2>Đã xem gần đây</h2></div></div><div className="recent-products-rail">{recent.map((product) => <a key={product.id} href={`/san-pham/${product.slug}`}><img src={product.image} alt={`${product.brand} ${product.name}`} loading="lazy"/><span>{product.name}</span><strong>{formatPrice(product.price)}</strong></a>)}</div></section>;
}
