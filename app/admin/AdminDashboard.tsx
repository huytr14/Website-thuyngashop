"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type EditorProduct } from "@/components/admin/ProductEditor";
import MediaPicker from "@/components/admin/MediaPicker";
import AdminChrome from "@/components/admin/AdminChrome";
import { Badge, Button, Dialog, EmptyState, Input, Select, Skeleton, StickySaveBar } from "@/components/admin/ui";
import "./editor.css";
import "./admin-extra.css";
import styles from "./admin.module.css";
import { type SiteContent } from "@/lib/site-content";
import { splitIssues } from "@/lib/admin-validation";

type Category = { id: number; name: string; slug: string; parentId: number | null };
type Product = EditorProduct & { categoryName: string | null };
type OrderStatus = "MOI" | "DA_XAC_NHAN" | "DANG_GIAO" | "HOAN_THANH" | "HUY";
type Order = { id: number; code: string; customerName: string; email: string; phone: string; address: string; city: string; district: string; note: string | null; subtotal: number; shippingFee: number; discount: number; total: number; voucherCode: string | null; paymentMethod: string; status: OrderStatus; createdAt: string };
type OrderItem = { id: number; productName: string; variantName: string | null; price: number; quantity: number };
type Settings = { freeShippingThreshold: number; standardShippingFee: number; flashSaleTitle: string; flashSaleStart: string | null; flashSaleEnd: string | null; bankName: string; bankAccountName: string; bankAccountNumber: string; vietQrUrl: string; shopEmail: string; aboutContent: string; contactContent: string; privacyPolicy: string; shippingPolicy: string; returnsPolicy: string; termsPolicy: string; siteContent: SiteContent };
type ContactMessage = { id: number; name: string; email: string; phone: string | null; message: string; createdAt: string };
type Review = { id: number; title: string; status: string; productName: string; customerName: string | null };

const nextStatuses: Record<OrderStatus, OrderStatus[]> = { MOI: ["DA_XAC_NHAN", "HUY"], DA_XAC_NHAN: ["DANG_GIAO", "HUY"], DANG_GIAO: ["HOAN_THANH", "HUY"], HOAN_THANH: [], HUY: [] };
const statusLabels: Record<OrderStatus, string> = { MOI: "Mới", DA_XAC_NHAN: "Đã xác nhận", DANG_GIAO: "Đang giao", HOAN_THANH: "Hoàn thành", HUY: "Đã hủy" };

const money = (value: number) => `${value.toLocaleString("vi-VN")}₫`;
const ProductEditor = lazy(() => import("@/components/admin/ProductEditor"));
const dateInput = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
const expiryWarning = (date: string | null) => { if (!date) return ""; const days = Math.ceil((Date.parse(`${date}T00:00:00Z`) - Date.now()) / 86400000); return days < 0 ? "Đã hết hạn" : days < 90 ? "HSD còn < 90 ngày" : ""; };

export default function AdminDashboard({ brand }: { brand: { logo: string; name: string } }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const productsRef = useRef<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [view, setView] = useState<"home" | "products" | "bulk" | "orders" | "settings">("home");
  const [urlReady, setUrlReady] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [orderDetail, setOrderDetail] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [productStatus, setProductStatus] = useState("ALL");
  const [productSort, setProductSort] = useState("name");
  const [productPage, setProductPage] = useState(0);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [qrMedia, setQrMedia] = useState<number[]>([]);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsIssues, setSettingsIssues] = useState<Record<string, string>>({});
  const settingsForm = useRef<HTMLFormElement>(null);
  const [savingCell, setSavingCell] = useState("");
  const [bulk, setBulk] = useState<Record<number, Partial<Product>>>({});
  const [bulkErrors, setBulkErrors] = useState<Record<number, string>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ title: string; detail: string; run: () => Promise<void> } | null>(null);
  const [productMenu, setProductMenu] = useState<number | null>(null);
  const [orderMenu, setOrderMenu] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [response, reviewResponse] = await Promise.all([fetch("/api/admin"), fetch("/api/admin/reviews")]);
      if (response.status === 401) return location.reload();
      if (!response.ok) throw new Error("Không thể tải dữ liệu quản trị");
      const data = await response.json();
      productsRef.current = data.products ?? []; setProducts(data.products ?? []); setCategories(data.categories ?? []); setOrders(data.orders ?? []); setSettings(data.settings ?? null); setMessages(data.messages ?? []);
      if (reviewResponse.ok) setReviews((await reviewResponse.json()).reviews ?? []);
      setError("");
    } catch { setError("Không thể tải dữ liệu quản trị. Vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { const sync = () => { const params = new URLSearchParams(location.search); const next = params.get("view"); setView(next && ["home", "products", "bulk", "orders", "settings"].includes(next) ? next as typeof view : "home"); setSearch(params.get("q") ?? ""); setProductStatus(params.get("published") ?? "ALL"); setOrderStatus((params.get("status") ?? "ALL") as typeof orderStatus); const editId = Number(params.get("edit")); setEditing(editId ? productsRef.current.find((item) => item.id === editId) : undefined); setUrlReady(true); }; sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  useEffect(() => { const editId = Number(new URLSearchParams(location.search).get("edit")); if (editId) setEditing((current) => current ?? products.find((item) => item.id === editId)); }, [products]);
  useEffect(() => { if (!urlReady) return; const params = new URLSearchParams(location.search); if (view === "home") params.delete("view"); else params.set("view", view); for (const [key, value] of [["q", search], ["published", productStatus === "ALL" ? "" : productStatus], ["status", orderStatus === "ALL" ? "" : orderStatus]]) { if (value) params.set(key, value); else params.delete(key); } history.replaceState(null, "", `/admin${params.size ? `?${params}` : ""}`); }, [urlReady, view, search, productStatus, orderStatus]);
  const filtered = useMemo(() => products.filter((item) => item.name.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN")) && (productStatus === "ALL" || item.published === (productStatus === "PUBLISHED"))).sort((a, b) => productSort === "price" ? a.price - b.price : productSort === "stock" ? a.inventoryQuantity - b.inventoryQuantity : a.name.localeCompare(b.name, "vi-VN")), [products, search, productStatus, productSort]);
  const filteredOrders = orders.filter((item) => (orderStatus === "ALL" || item.status === orderStatus) && item.code.toLowerCase().includes(orderSearch.trim().toLowerCase()));
  const pageProducts = filtered.slice(productPage * 20, (productPage + 1) * 20);
  const pageOrders = filteredOrders.slice(orderPage * 20, (orderPage + 1) * 20);
  useEffect(() => setProductPage(0), [search, productStatus, productSort]);
  useEffect(() => setOrderPage(0), [orderStatus, orderSearch]);
  useEffect(() => { const beforeUnload = (event: BeforeUnloadEvent) => { if (settingsDirty) event.preventDefault(); }; window.addEventListener("beforeunload", beforeUnload); return () => window.removeEventListener("beforeunload", beforeUnload); }, [settingsDirty]);
  const pendingReviews = reviews.filter((item) => item.status === "PENDING");
  const pendingOrders = orders.filter((item) => item.status === "MOI");
  const lowStock = products.filter((item) => item.trackInventory && item.inventoryQuantity <= 5);
  const today = new Date().toDateString();
  const start7 = Date.now() - 7 * 86400000;
  const sales = orders.filter((item) => item.status !== "HUY");
  const daily = Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - 13 + index); return { label: `${date.getDate()}/${date.getMonth() + 1}`, value: sales.filter((item) => new Date(item.createdAt).toDateString() === date.toDateString()).reduce((sum, item) => sum + item.total, 0) }; });
  const maxDaily = Math.max(1, ...daily.map((item) => item.value));
  const flash = (message: string, tone: "success" | "error" = "success") => { window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message, tone } })); };
  const quick = async (updates: { id: number; price?: number; oldPrice?: number; inventoryQuantity?: number; published?: boolean }[]) => {
    setSavingCell(updates.length === 1 ? String(updates[0].id) : "bulk");
    const response = await fetch("/api/admin/products/quick", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) });
    const data = await response.json(); setSavingCell("");
    if (!response.ok) { flash(data.error ?? "Không thể lưu"); return; }
    const errors = Object.fromEntries(data.results.filter((item: { error?: string }) => item.error).map((item: { id: number; error: string }) => [item.id, item.error])); setBulkErrors(errors);
    if (updates.length > 1) setBulk((current) => Object.fromEntries(Object.entries(current).filter(([id]) => errors[Number(id)])));
    if (data.results.some((item: { product?: Product }) => item.product)) await load();
    flash(Object.keys(errors).length ? "Đã lưu các dòng hợp lệ; kiểm tra dòng lỗi" : "Đã lưu");
  };

  const duplicateProduct = async (product: Product) => {
    const response = await fetch(`/api/admin/products/${product.id}/duplicate`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) return flash(data.error ?? "Không thể nhân bản");
    await load(); setEditing({ ...data.product, categoryName: product.categoryName, mediaIds: product.mediaIds }); flash("Đã tạo bản nháp nhân bản");
  };

  const deleteProduct = async (product: Product) => {
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return flash(data.error ?? "Không thể xóa sản phẩm");
    setProducts((items) => items.filter(({ id }) => id !== product.id));
    flash("Đã xóa sản phẩm");
  };

  const importCsv = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCsvErrors([]);
    const response = await fetch("/api/admin/products/import", { method: "POST", body: new FormData(event.currentTarget) });
    const data = await response.json();
    if (!response.ok) return setCsvErrors(data.errors ?? [data.error ?? "Không thể nhập CSV"]);
    await load();
    event.currentTarget.reset();
    flash(`CSV hoàn tất: ${data.created} mới, ${data.updated} cập nhật`);
  };

  const openOrder = async (id: number) => {
    const response = await fetch(`/api/admin/orders/${id}`);
    const data = await response.json();
    if (!response.ok) return flash(data.error ?? "Không thể tải đơn hàng");
    setOrderDetail(data);
  };

  const changeOrderStatus = async (id: number, status: OrderStatus) => {
    const response = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) return flash(data.error ?? "Không thể đổi trạng thái");
    setOrders((items) => items.map((order) => order.id === id ? data.order : order));
    setOrderDetail((detail) => detail?.order.id === id ? { ...detail, order: data.order } : detail);
    flash("Đã cập nhật trạng thái đơn");
  };
  const askOrderStatus = (order: Order, status: OrderStatus) => setConfirmAction({ title: `${statusLabels[status]} đơn ${order.code}?`, detail: status === "HUY" ? "Đơn sẽ bị hủy và tồn kho được hoàn theo quy tắc hiện tại." : `Trạng thái đơn sẽ chuyển thành “${statusLabels[status]}”.`, run: () => changeOrderStatus(order.id, status) });
  const changeSelectedOrders = async (status: OrderStatus) => {
    const changed: Order[] = [];
    const failed: string[] = [];
    for (const order of orders.filter((item) => selectedOrderIds.includes(item.id) && nextStatuses[item.status].includes(status))) {
      try { const response = await fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); changed.push(data.order); }
      catch { failed.push(order.code); }
    }
    setOrders((items) => items.map((item) => changed.find((updated) => updated.id === item.id) ?? item));
    setSelectedOrderIds(failed.length ? orders.filter((item) => failed.includes(item.code)).map((item) => item.id) : []);
    flash(failed.length ? `Đã cập nhật ${changed.length} đơn; chưa cập nhật: ${failed.join(", ")}` : `Đã cập nhật ${changed.length} đơn`, failed.length ? "error" : "success");
  };
  const hideSelected = async () => { await quick(selectedIds.map((id) => ({ id, published: false }))); setSelectedIds([]); };

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (qrMedia.length) { const response = await fetch("/api/admin/media"); const data = await response.json(); payload.vietQrUrl = data.media.find((item: { id: number }) => item.id === qrMedia[0])?.url ?? payload.vietQrUrl; }
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { const { at, other } = splitIssues(data, ["flashSaleTitle", "flashSaleStart", "flashSaleEnd", "freeShippingThreshold", "standardShippingFee", "bankName", "bankAccountName", "bankAccountNumber", "vietQrUrl", "shopEmail", "aboutContent", "privacyPolicy", "shippingPolicy", "returnsPolicy", "termsPolicy"]); setSettingsIssues(at); if (other) flash(other, "error"); return; }
    setSettings(data.settings);
    setSettingsDirty(false);
    setSettingsIssues({});
    flash("Đã lưu cấu hình cửa hàng");
  };
  const closeEditor = () => { setEditing(undefined); const params = new URLSearchParams(location.search); params.delete("edit"); history.replaceState(null, "", `/admin${params.size ? `?${params}` : ""}`); };
  const settingsField = (name: string) => settingsIssues[name] && <small className="editor-field-error" role="alert">{settingsIssues[name]}</small>;

  return <AdminChrome title={view === "home" ? "Tổng quan" : view === "products" ? "Sản phẩm" : view === "bulk" ? "Sửa hàng loạt" : view === "orders" ? "Đơn hàng" : "Cấu hình"} brand={brand} view={view} onViewChange={(next, href) => { setView(next as typeof view); const params = new URL(href, location.origin).searchParams; const editId = Number(params.get("edit")); setEditing(editId ? products.find((item) => item.id === editId) : undefined); const code = params.get("order"); if (code) { const order = orders.find((item) => item.code === code); if (order) void openOrder(order.id); } }} action={view === "products" && <Button variant="primary" onClick={() => { setError(""); setEditing(null); }}>＋ THÊM SẢN PHẨM</Button>}>
      {notice && <div className={styles.notice}>✓ {notice}</div>}

      {view === "home" && <section className={styles.panel}>
        {loading ? <Skeleton rows={5}/> : error ? <EmptyState title={error} action={<Button onClick={() => void load()}>Thử lại</Button>}/> : <>
          <div className="admin-metrics"><button onClick={() => setView("orders")}><small>Doanh thu hôm nay</small><strong>{money(sales.filter((item) => new Date(item.createdAt).toDateString() === today).reduce((sum, item) => sum + item.total, 0))}</strong></button><button onClick={() => setView("orders")}><small>Doanh thu 7 ngày</small><strong>{money(sales.filter((item) => new Date(item.createdAt).getTime() >= start7).reduce((sum, item) => sum + item.total, 0))}</strong></button><button onClick={() => { setOrderStatus("MOI"); setView("orders"); }}><small>Đơn hôm nay / chờ xác nhận</small><strong>{orders.filter((item) => new Date(item.createdAt).toDateString() === today).length} / {pendingOrders.length}</strong></button><button onClick={() => router.push("/admin/danh-gia?status=PENDING")}><small>Đánh giá chờ duyệt</small><strong>{pendingReviews.length}</strong></button></div>
          <div className="admin-overview-grid"><div><h2>Doanh thu 14 ngày</h2><svg className="admin-sales-chart" viewBox="0 0 700 180" role="img" aria-label="Biểu đồ doanh thu 14 ngày">{daily.map((day, index) => <g key={index}><rect x={index * 50 + 6} y={150 - day.value / maxDaily * 130} width="32" height={Math.max(2, day.value / maxDaily * 130)} rx="3" fill="#800028"/><text x={index * 50 + 22} y="171" textAnchor="middle" fontSize="11">{day.label}</text></g>)}</svg></div><div><h2>Việc cần xử lý</h2>{pendingOrders.slice(0, 5).map((order) => <button className="admin-task" key={order.id} onClick={() => { setOrderStatus("MOI"); setView("orders"); void openOrder(order.id); }}>Đơn {order.code} · {money(order.total)}</button>)}{pendingReviews.slice(0, 5).map((review) => <a className="admin-task" key={review.id} href="/admin/danh-gia?status=PENDING">Đánh giá {review.productName} · {review.customerName ?? "Khách hàng"}</a>)}{!pendingOrders.length && !pendingReviews.length && <EmptyState title="Không có việc đang chờ."/>}</div></div>
          <h2>Tồn kho sắp hết</h2>{lowStock.slice(0, 8).map((item) => <button className="admin-task" key={item.id} onClick={() => { setView("products"); setEditing(item); }}>{item.name} · còn {item.inventoryQuantity}</button>)}{!lowStock.length && <EmptyState title="Chưa có sản phẩm sắp hết hàng."/>}
        </>}
      </section>}

      {view === "products" && <><section className={styles.importPanel}>
        <div><p>NHẬP NHANH</p><h2>Nhập sản phẩm từ CSV</h2><span>Tạo mới hoặc cập nhật theo tên sản phẩm. File sai sẽ không ghi dữ liệu.</span></div>
        <form onSubmit={importCsv}><input required type="file" name="file" accept=".csv,text/csv"/><button type="submit">NHẬP CSV</button><a href="/products-sample.csv" download>Tải file mẫu 2 dòng</a></form>
        {!!csvErrors.length && <div className={styles.csvErrors}>{csvErrors.map((message) => <p key={message}>{message}</p>)}</div>}
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}><label>⌕<Input aria-label="Tìm theo tên sản phẩm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm..."/></label><Select aria-label="Lọc sản phẩm" value={productStatus} onChange={(event) => setProductStatus(event.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="PUBLISHED">Đang bán</option><option value="DRAFT">Bản nháp</option></Select><Select aria-label="Sắp xếp sản phẩm" value={productSort} onChange={(event) => setProductSort(event.target.value)}><option value="name">Tên A–Z</option><option value="price">Giá tăng dần</option><option value="stock">Tồn kho tăng dần</option></Select>{!loading && <span>{filtered.length} sản phẩm</span>}</div>
        {error && <EmptyState title={error} action={<Button onClick={() => void load()}>Thử lại</Button>}/>}
        {selectedIds.length > 0 && <div className="admin-selection-bar"><strong>Đã chọn {selectedIds.length} sản phẩm</strong><Button onClick={() => setSelectedIds([])}>Bỏ chọn</Button><Button variant="primary" onClick={() => setConfirmAction({ title: `Ẩn ${selectedIds.length} sản phẩm?`, detail: "Các sản phẩm đã chọn sẽ không còn xuất hiện trên cửa hàng.", run: hideSelected })}>Ẩn hàng loạt</Button><Button variant="danger" disabled={selectedIds.some((id) => products.find((item) => item.id === id)?.published)} onClick={() => setConfirmAction({ title: `Xóa ${selectedIds.length} bản nháp?`, detail: "Xóa vĩnh viễn các bản nháp đã chọn; không thể hoàn tác.", run: async () => { for (const id of selectedIds) { const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Không thể xóa một bản nháp"); } setSelectedIds([]); await load(); } })}>Xóa nháp</Button></div>}
        {loading ? <Skeleton rows={5}/> : <div className={styles.productTable}>
          <div className={styles.tableHeader}><span><input type="checkbox" aria-label="Chọn tất cả sản phẩm trang này" checked={pageProducts.length > 0 && pageProducts.every((item) => selectedIds.includes(item.id))} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...pageProducts.map((item) => item.id)])] : selectedIds.filter((id) => !pageProducts.some((item) => item.id === id)))}/> SẢN PHẨM</span><span>DANH MỤC</span><span>GIÁ</span><span>TỒN KHO</span><span>THAO TÁC</span></div>
          {pageProducts.map((product) => <div className={styles.productRow} key={product.id}>
            <span><input type="checkbox" aria-label={`Chọn ${product.name}`} checked={selectedIds.includes(product.id)} onChange={(event) => setSelectedIds(event.target.checked ? [...selectedIds, product.id] : selectedIds.filter((id) => id !== product.id))}/><img src={product.image} alt=""/><i><b>{product.name}</b><small>{product.brand} · /{product.slug}</small></i></span>
            <span>{product.categoryName ?? "Chưa chọn"}<Badge tone={product.published ? "success" : "neutral"}>{product.published ? "Đang bán" : "Bản nháp"}</Badge>{expiryWarning(product.expiryDate) && <small className={expiryWarning(product.expiryDate) === "Đã hết hạn" ? "expiry-expired" : "expiry-soon"}>{expiryWarning(product.expiryDate)}</small>}</span><span><Input aria-label={`Giá bán ${product.name}`} type="number" min="0" defaultValue={product.price} key={`${product.id}-${product.price}`} onKeyDown={(event) => { if (event.key === "Enter") void quick([{ id: product.id, price: Number(event.currentTarget.value) }]); }}/><button type="button" disabled={savingCell === String(product.id)} onClick={(event) => void quick([{ id: product.id, price: Number((event.currentTarget.previousElementSibling as HTMLInputElement).value) }])}>Lưu giá</button>{product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}</span>
            <span className={product.inStock ? styles.inStock : styles.outOfStock}>{product.variantRows.length ? <button type="button" onClick={() => setEditing(product)}>Sửa tồn biến thể</button> : <><Input aria-label={`Tồn kho ${product.name}`} type="number" min="0" defaultValue={product.inventoryQuantity} key={`${product.id}-${product.inventoryQuantity}`} onKeyDown={(event) => { if (event.key === "Enter") void quick([{ id: product.id, inventoryQuantity: Number(event.currentTarget.value) }]); }}/><button type="button" disabled={savingCell === String(product.id)} onClick={(event) => void quick([{ id: product.id, inventoryQuantity: Number((event.currentTarget.previousElementSibling as HTMLInputElement).value) }])}>Lưu tồn</button></>}</span>
            <span className="admin-row-menu"><Button aria-label={`Hành động ${product.name}`} aria-expanded={productMenu === product.id} onClick={() => setProductMenu(productMenu === product.id ? null : product.id)}>⋯</Button>{productMenu === product.id && <div role="menu"><button role="menuitem" onClick={() => { setProductMenu(null); setEditing(product); }}>Sửa</button><button role="menuitem" onClick={() => { setProductMenu(null); void duplicateProduct(product); }}>Nhân bản</button><button role="menuitem" onClick={() => { setProductMenu(null); void quick([{ id: product.id, published: !product.published }]); }}>{product.published ? "Ẩn" : "Hiện"}</button><button role="menuitem" onClick={() => { setProductMenu(null); setConfirmAction({ title: `Xóa ${product.name}?`, detail: "Sản phẩm sẽ bị xóa vĩnh viễn nếu chưa có đơn liên quan.", run: () => deleteProduct(product) }); }}>Xóa</button></div>}</span>
          </div>)}
          {!filtered.length && <EmptyState title="Không tìm thấy sản phẩm."/>}
        </div>}
        {filtered.length > 20 && <div className="admin-pagination"><Button disabled={productPage === 0} onClick={() => setProductPage(productPage - 1)}>Trước</Button><span>Trang {productPage + 1}/{Math.ceil(filtered.length / 20)}</span><Button disabled={(productPage + 1) * 20 >= filtered.length} onClick={() => setProductPage(productPage + 1)}>Sau</Button></div>}
      </section></>}

      {view === "bulk" && <section className={styles.panel}><p>Sửa nhiều dòng, sau đó lưu một lần. Dòng không hợp lệ sẽ được đánh dấu, dòng đúng vẫn lưu.</p><div className="admin-bulk-table"><div className="admin-bulk-head"><b>Tên</b><b>Giá bán</b><b>Giá gốc</b><b>Tồn kho</b><b>Đang bán</b></div>{products.map((product) => <div className={bulkErrors[product.id] ? "admin-bulk-row error" : "admin-bulk-row"} key={product.id}><span>{product.name}{bulkErrors[product.id] && <small role="alert">{bulkErrors[product.id]}</small>}</span>{(["price", "oldPrice", "inventoryQuantity"] as const).map((field) => <input key={field} aria-label={`${field} ${product.name}`} type="number" min="0" disabled={field === "inventoryQuantity" && !!product.variantRows.length} title={field === "inventoryQuantity" && product.variantRows.length ? "Sửa tồn từng biến thể trong trình sửa sản phẩm" : undefined} value={bulk[product.id]?.[field] ?? product[field]} onChange={(event) => setBulk((current) => ({ ...current, [product.id]: { ...current[product.id], [field]: Number(event.target.value) } }))}/>)}<input type="checkbox" aria-label={`Đang bán ${product.name}`} checked={bulk[product.id]?.published ?? product.published} onChange={(event) => setBulk((current) => ({ ...current, [product.id]: { ...current[product.id], published: event.target.checked } }))}/></div>)}</div><button className={styles.primary} type="button" disabled={savingCell === "bulk" || !Object.keys(bulk).length} onClick={() => void quick(Object.entries(bulk).map(([id, fields]) => ({ id: Number(id), price: fields.price, oldPrice: fields.oldPrice, inventoryQuantity: fields.inventoryQuantity, published: fields.published })))}>{savingCell === "bulk" ? "Đang lưu..." : "Lưu tất cả"}</button></section>}

      {view === "orders" && <section className={styles.panel}>
        <div className={styles.toolbar}><Input aria-label="Tìm mã đơn" placeholder="Tìm mã đơn" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)}/><Select aria-label="Lọc trạng thái đơn" value={orderStatus} onChange={(event) => setOrderStatus(event.target.value as "ALL" | OrderStatus)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><span>{filteredOrders.length} đơn hàng</span></div>
        {selectedOrderIds.length > 0 && <div className="admin-selection-bar"><strong>Đã chọn {selectedOrderIds.length} đơn</strong><Button onClick={() => setSelectedOrderIds([])}>Bỏ chọn</Button>{Object.keys(statusLabels).filter((status) => selectedOrderIds.every((id) => { const order = orders.find((item) => item.id === id); return order && nextStatuses[order.status].includes(status as OrderStatus); })).map((status) => <Button key={status} variant={status === "HUY" ? "danger" : "primary"} onClick={() => setConfirmAction({ title: `${statusLabels[status as OrderStatus]} ${selectedOrderIds.length} đơn?`, detail: status === "HUY" ? "Các đơn sẽ bị hủy và hoàn tồn kho theo quy tắc hiện tại." : "Tất cả đơn đã chọn sẽ chuyển trạng thái.", run: () => changeSelectedOrders(status as OrderStatus) })}>{statusLabels[status as OrderStatus]}</Button>)}</div>}
        <div className={styles.orderTable}>
          <div className={styles.orderHeader}><span><input type="checkbox" aria-label="Chọn tất cả đơn trang này" checked={pageOrders.length > 0 && pageOrders.every((item) => selectedOrderIds.includes(item.id))} onChange={(event) => setSelectedOrderIds(event.target.checked ? [...new Set([...selectedOrderIds, ...pageOrders.map((item) => item.id)])] : selectedOrderIds.filter((id) => !pageOrders.some((item) => item.id === id)))}/> MÃ ĐƠN</span><span>KHÁCH HÀNG</span><span>TỔNG TIỀN</span><span>THANH TOÁN</span><span>TRẠNG THÁI</span><span>THAO TÁC</span></div>
          {pageOrders.map((order) => <div className={styles.orderRow} key={order.id}><span><input type="checkbox" aria-label={`Chọn đơn ${order.code}`} checked={selectedOrderIds.includes(order.id)} onChange={(event) => setSelectedOrderIds(event.target.checked ? [...selectedOrderIds, order.id] : selectedOrderIds.filter((id) => id !== order.id))}/><button type="button" onClick={() => void openOrder(order.id)}><b>{order.code}</b></button><small>{new Date(order.createdAt).toLocaleString("vi-VN")}</small></span><span><b>{order.customerName}</b><small>{order.phone}</small></span><span>{money(order.total)}</span><span>{order.paymentMethod === "COD" ? "COD" : "Chuyển khoản"}</span><span><Badge tone={order.status === "MOI" ? "warning" : order.status === "HUY" ? "danger" : order.status === "HOAN_THANH" ? "success" : "info"}>{statusLabels[order.status]}</Badge></span><span className="admin-row-menu"><Button aria-label={`Hành động đơn ${order.code}`} aria-expanded={orderMenu === order.id} onClick={() => setOrderMenu(orderMenu === order.id ? null : order.id)}>⋯</Button>{orderMenu === order.id && <div role="menu"><button role="menuitem" onClick={() => { setOrderMenu(null); void openOrder(order.id); }}>Xem chi tiết</button>{nextStatuses[order.status].map((status) => <button role="menuitem" key={status} onClick={() => { setOrderMenu(null); askOrderStatus(order, status); }}>{statusLabels[status]}</button>)}</div>}</span></div>)}
          {!filteredOrders.length && <EmptyState title="Chưa có đơn hàng ở bộ lọc này."/>}
        </div>
        {filteredOrders.length > 20 && <div className="admin-pagination"><Button disabled={orderPage === 0} onClick={() => setOrderPage(orderPage - 1)}>Trước</Button><span>Trang {orderPage + 1}/{Math.ceil(filteredOrders.length / 20)}</span><Button disabled={(orderPage + 1) * 20 >= filteredOrders.length} onClick={() => setOrderPage(orderPage + 1)}>Sau</Button></div>}
      </section>}

      {view === "settings" && settings && <section className={styles.panel}><form ref={settingsForm} className={styles.settingsForm} onInput={(event) => { setSettingsDirty(true); const name = (event.target as HTMLInputElement).name; if (name) setSettingsIssues((current) => ({ ...current, [name]: "" })); }} onSubmit={saveSettings}>
        <label>TIÊU ĐỀ FLASH SALE<input name="flashSaleTitle" maxLength={100} defaultValue={settings.flashSaleTitle}/>{settingsField("flashSaleTitle")}</label>
        <label>BẮT ĐẦU FLASH SALE<input type="datetime-local" name="flashSaleStart" defaultValue={dateInput(settings.flashSaleStart)}/>{settingsField("flashSaleStart")}</label>
        <label>KẾT THÚC FLASH SALE<input type="datetime-local" name="flashSaleEnd" defaultValue={dateInput(settings.flashSaleEnd)}/>{settingsField("flashSaleEnd")}</label>
        <label>MIỄN PHÍ SHIP TỪ<input required min="0" type="number" name="freeShippingThreshold" defaultValue={settings.freeShippingThreshold}/>{settingsField("freeShippingThreshold")}</label>
        <label>PHÍ SHIP TIÊU CHUẨN<input required min="0" type="number" name="standardShippingFee" defaultValue={settings.standardShippingFee}/>{settingsField("standardShippingFee")}</label>
        <label>NGÂN HÀNG<input name="bankName" maxLength={150} defaultValue={settings.bankName}/>{settingsField("bankName")}</label>
        <label>CHỦ TÀI KHOẢN<input name="bankAccountName" maxLength={150} defaultValue={settings.bankAccountName}/>{settingsField("bankAccountName")}</label>
        <label>SỐ TÀI KHOẢN<input name="bankAccountNumber" maxLength={50} defaultValue={settings.bankAccountNumber}/>{settingsField("bankAccountNumber")}</label>
        <label>ẢNH VIETQR <MediaPicker selected={qrMedia} onChange={(ids) => { setQrMedia(ids); setSettingsDirty(true); setSettingsIssues((current) => ({ ...current, vietQrUrl: "" })); }} multiple={false}/><input name="vietQrUrl" type="url" maxLength={2000} defaultValue={settings.vietQrUrl} placeholder="URL cũ (dự phòng)"/>{settingsField("vietQrUrl")}</label>
        <label className={styles.full}>EMAIL NHẬN THÔNG BÁO ĐƠN<input name="shopEmail" type="email" maxLength={255} defaultValue={settings.shopEmail}/>{settingsField("shopEmail")}</label>
        <label className={styles.full}>NỘI DUNG GIỚI THIỆU<textarea name="aboutContent" required rows={7} defaultValue={settings.aboutContent}/>{settingsField("aboutContent")}</label>
        <input type="hidden" name="contactContent" value={settings.contactContent}/>
        <label className={styles.full}>CHÍNH SÁCH BẢO MẬT<textarea name="privacyPolicy" required rows={7} defaultValue={settings.privacyPolicy}/>{settingsField("privacyPolicy")}</label>
        <label className={styles.full}>CHÍNH SÁCH VẬN CHUYỂN<textarea name="shippingPolicy" required rows={7} defaultValue={settings.shippingPolicy}/>{settingsField("shippingPolicy")}</label>
        <label className={styles.full}>CHÍNH SÁCH ĐỔI TRẢ<textarea name="returnsPolicy" required rows={7} defaultValue={settings.returnsPolicy}/>{settingsField("returnsPolicy")}</label>
        <label className={styles.full}>ĐIỀU KHOẢN<textarea name="termsPolicy" required rows={7} defaultValue={settings.termsPolicy}/>{settingsField("termsPolicy")}</label>
      </form><StickySaveBar dirty={settingsDirty} onUndo={() => { settingsForm.current?.reset(); setQrMedia([]); setSettingsDirty(false); setSettingsIssues({}); }} onSave={() => settingsForm.current?.requestSubmit()} saveText="LƯU CẤU HÌNH"/><div className={styles.messages}><h2>Lời nhắn liên hệ</h2>{messages.map((item) => <article key={item.id}><b>{item.name}</b><small>{item.email}{item.phone ? ` · ${item.phone}` : ""} · {new Date(item.createdAt).toLocaleString("vi-VN")}</small><p>{item.message}</p></article>)}{!messages.length && <p>Chưa có lời nhắn.</p>}</div></section>}
    {editing !== undefined && <Suspense fallback={<Skeleton rows={3}/>}><ProductEditor key={editing?.id ?? "new"} product={editing} categories={categories} badges={[...new Set(products.map((item) => item.badge).filter((item): item is string => !!item))]} onClose={closeEditor} onSaved={() => { closeEditor(); void load(); flash("Đã lưu sản phẩm"); }}/></Suspense>
    }

    {orderDetail && <div className={styles.modalBack} onMouseDown={() => setOrderDetail(null)}><section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
      <div className={styles.modalHead}><div><p>CHI TIẾT ĐƠN HÀNG</p><h2>{orderDetail.order.code}</h2></div><button type="button" onClick={() => setOrderDetail(null)}>×</button></div>
      <div className={styles.orderInfo}><p><b>{orderDetail.order.customerName}</b><br/>{orderDetail.order.phone} · {orderDetail.order.email}</p><p>{orderDetail.order.address}, {orderDetail.order.district}, {orderDetail.order.city}</p>{orderDetail.order.note && <p>Ghi chú: {orderDetail.order.note}</p>}<p>Thanh toán: {orderDetail.order.paymentMethod === "COD" ? "COD" : "Chuyển khoản"}</p></div>
      <div className={styles.orderItems}>{orderDetail.items.map((item) => <p key={item.id}><span>{item.productName}{item.variantName && ` · ${item.variantName}`} × {item.quantity}</span><b>{money(item.price * item.quantity)}</b></p>)}</div>
      <div className={styles.orderTotals}><p><span>Tạm tính</span><b>{money(orderDetail.order.subtotal)}</b></p><p><span>Phí ship</span><b>{money(orderDetail.order.shippingFee)}</b></p><p><span>Giảm giá</span><b>−{money(orderDetail.order.discount)}</b></p><p><span>Tổng cộng</span><b>{money(orderDetail.order.total)}</b></p></div>
      {!!nextStatuses[orderDetail.order.status].length && <div className={styles.statusActions}>{nextStatuses[orderDetail.order.status].map((status) => <button className={styles.primary} key={status} onClick={() => askOrderStatus(orderDetail.order, status)}>{statusLabels[status]}</button>)}</div>}
    </section></div>}
    <Dialog open={!!confirmAction} title={confirmAction?.title ?? "Xác nhận"} onClose={() => setConfirmAction(null)}><p>{confirmAction?.detail}</p><div className="admin-ui-dialog-actions"><Button onClick={() => setConfirmAction(null)}>Quay lại</Button><Button variant="danger" onClick={() => { const action = confirmAction; setConfirmAction(null); void action?.run().catch(() => flash("Không thể hoàn tất thao tác", "error")); }}>Xác nhận</Button></div></Dialog>
  </AdminChrome>;
}
