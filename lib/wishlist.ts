"use client";

import { useEffect, useState } from "react";

const key = "thuynga_wishlist_v1";
const localIds = () => { try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value.filter((id) => Number.isInteger(id) && id > 0).slice(0, 100) as number[] : []; } catch { return []; } };

export function useWishlist() {
  const [ids, setIds] = useState<number[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { const local = localIds(); setIds(local); const sync = () => setIds(localIds()); window.addEventListener("thuynga-wishlist", sync); void fetch("/api/account/wishlist").then(async (response) => { if (!response.ok) return; setSignedIn(true); const data = await response.json() as { productIds: number[] }; const merged = [...new Set([...data.productIds, ...local])]; setIds(merged); localStorage.setItem(key, JSON.stringify(merged)); window.dispatchEvent(new Event("thuynga-wishlist")); if (local.some((id) => !data.productIds.includes(id))) await fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: local }) }); }).catch(() => {}); return () => window.removeEventListener("thuynga-wishlist", sync); }, []);
  const toggle = async (id: number) => { const liked = ids.includes(id); const next = liked ? ids.filter((item) => item !== id) : [...ids, id]; setIds(next); localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event("thuynga-wishlist")); if (signedIn) await fetch("/api/account/wishlist", { method: liked ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(liked ? { productId: id } : { productIds: [id] }) }); };
  return { ids, toggle };
}
