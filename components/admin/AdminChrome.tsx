"use client";

import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "./ui";
import "./admin-chrome.css";

const CommandPalette = lazy(() => import("./CommandPalette"));

const groups = [
  { title: "Vận hành", links: [["Tổng quan", "/admin"], ["Đơn hàng", "/admin?view=orders"], ["Sản phẩm", "/admin?view=products"], ["Sửa hàng loạt", "/admin?view=bulk"], ["Danh mục", "/admin/danh-muc"], ["Kho ảnh", "/admin/thu-vien-anh"]] },
  { title: "Nội dung", links: [["Giao diện", "/admin/giao-dien"], ["Bài viết", "/admin/tin-tuc"], ["Đánh giá", "/admin/danh-gia"]] },
  { title: "Bán hàng", links: [["Mã giảm giá", "/admin/ma-giam-gia"], ["Khách hàng", "/admin/khach-hang"], ["Cấu hình", "/admin?view=settings"]] },
] as const;
const canLeave = () => !document.querySelector(".admin-ui-save-bar") || confirm("Bỏ thay đổi chưa lưu?");

export default function AdminChrome({ title, brand, children, action, view, onViewChange }: { title: string; brand: { logo: string; name: string }; children: ReactNode; action?: ReactNode; view?: string; onViewChange?: (view: string, href: string) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [catalog, setCatalog] = useState<{ products: { id: number; name: string; slug: string }[]; orders: { code: string }[] } | null>(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  useEffect(() => {
    void Promise.all([fetch("/api/admin"), fetch("/api/admin/reviews")]).then(async ([main, reviews]) => {
      if (main.ok) { const data = await main.json(); setCatalog({ products: data.products ?? [], orders: data.orders ?? [] }); setPendingOrders((data.orders ?? []).filter((order: { status: string }) => order.status === "MOI").length); }
      if (reviews.ok) { const data = await reviews.json(); setPendingReviews((data.reviews ?? []).filter((review: { status: string }) => review.status === "PENDING").length); }
    }).catch(() => {});
  }, []);
  useEffect(() => { const key = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((open) => !open); } else if (event.key === "Escape") setPaletteOpen(false); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, []);
  const navigate = (href: string) => { if (!canLeave()) return; setPaletteOpen(false); setMobileOpen(false); if (pathname === "/admin" && href.startsWith("/admin?view=") && onViewChange) { const params = new URL(href, location.origin).searchParams; onViewChange(params.get("view") ?? "home", href); history.pushState(null, "", href); } else router.push(href); };
  const activeHref = pathname === "/admin" ? view === "home" ? "/admin" : `/admin?view=${view}` : pathname;
  return <ToastProvider><div className={`admin-chrome${collapsed ? " is-collapsed" : ""}`}>
    {mobileOpen && <button className="admin-chrome-shade" aria-label="Đóng điều hướng" onClick={() => setMobileOpen(false)}/>}
    <aside className={`admin-chrome-sidebar${mobileOpen ? " is-open" : ""}`}>
      <div className="admin-chrome-brand"><Link href="/" onClick={(event) => { if (!canLeave()) event.preventDefault(); }}><img src={brand.logo} alt={brand.name}/></Link><button type="button" aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? "»" : "«"}</button></div>
      <nav aria-label="Điều hướng quản trị">{groups.map((group) => <section key={group.title}><h2>{group.title}</h2>{group.links.map(([label, href]) => <Link key={href} href={href} aria-current={activeHref === href ? "page" : undefined} onClick={(event) => { if (!canLeave()) { event.preventDefault(); return; } setMobileOpen(false); if (pathname === "/admin" && href.startsWith("/admin") && !href.startsWith("/admin/") && onViewChange) { event.preventDefault(); const next = new URL(href, location.origin).searchParams.get("view") ?? "home"; onViewChange(next, href); history.pushState(null, "", href); } }}>{label}{label === "Sản phẩm" && catalog && <small>{catalog.products.length}</small>}{label === "Đơn hàng" && pendingOrders > 0 && <small>{pendingOrders}</small>}{label === "Đánh giá" && pendingReviews > 0 && <small>{pendingReviews}</small>}</Link>)}</section>)}</nav>
      <div className="admin-chrome-bottom"><Link href="/" onClick={(event) => { if (!canLeave()) event.preventDefault(); }}>← Xem cửa hàng</Link><form action="/api/admin/logout" method="post"><button type="submit">Đăng xuất</button></form></div>
    </aside>
    <main className="admin-chrome-main"><header className="admin-chrome-topbar"><button type="button" className="admin-chrome-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Mở điều hướng">☰</button><div><p>QUẢN TRỊ / {title}</p><h1>{title}</h1></div><button type="button" className="admin-chrome-search" onClick={() => setPaletteOpen(true)} aria-label="Tìm nhanh toàn cục">⌕ <span>Tìm nhanh</span> <kbd>Ctrl K</kbd></button>{action}</header>{children}</main>
    {paletteOpen && <Suspense fallback={null}><CommandPalette pages={groups.flatMap((group) => group.links.map(([label, href]) => ({ label, detail: group.title, href })))} catalog={catalog} onNavigate={navigate} onClose={() => setPaletteOpen(false)}/></Suspense>}
  </div></ToastProvider>;
}
