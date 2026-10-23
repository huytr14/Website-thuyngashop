"use client";

import { useEffect, useMemo, useState } from "react";
import ProductEditor, { type EditorProduct } from "@/components/admin/ProductEditor";
import MediaPicker from "@/components/admin/MediaPicker";
import "./editor.css";
import "./admin-extra.css";
import styles from "./admin.module.css";
import { defaultSiteContent, mergeSiteContent, type SiteContent } from "@/lib/site-content";

type Category = { id: number; name: string; slug: string; parentId: number | null };
type Product = EditorProduct & { categoryName: string | null };
type OrderStatus = "MOI" | "DA_XAC_NHAN" | "DANG_GIAO" | "HOAN_THANH" | "HUY";
type Order = { id: number; code: string; customerName: string; email: string; phone: string; address: string; city: string; district: string; note: string | null; subtotal: number; shippingFee: number; discount: number; total: number; voucherCode: string | null; paymentMethod: string; status: OrderStatus; createdAt: string };
type OrderItem = { id: number; productName: string; variantName: string | null; price: number; quantity: number };
type Settings = { freeShippingThreshold: number; standardShippingFee: number; flashSaleTitle: string; flashSaleStart: string | null; flashSaleEnd: string | null; bankName: string; bankAccountName: string; bankAccountNumber: string; vietQrUrl: string; shopEmail: string; aboutContent: string; contactContent: string; privacyPolicy: string; shippingPolicy: string; returnsPolicy: string; termsPolicy: string; siteContent: SiteContent };
type ContactMessage = { id: number; name: string; email: string; phone: string | null; message: string; createdAt: string };

const nextStatuses: Record<OrderStatus, OrderStatus[]> = { MOI: ["DA_XAC_NHAN", "HUY"], DA_XAC_NHAN: ["DANG_GIAO", "HUY"], DANG_GIAO: ["HOAN_THANH", "HUY"], HOAN_THANH: [], HUY: [] };
const statusLabels: Record<OrderStatus, string> = { MOI: "Mới", DA_XAC_NHAN: "Đã xác nhận", DANG_GIAO: "Đang giao", HOAN_THANH: "Hoàn thành", HUY: "Đã hủy" };

const money = (value: number) => `${value.toLocaleString("vi-VN")}₫`;
const dateInput = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
const expiryWarning = (date: string | null) => { if (!date) return ""; const days = Math.ceil((Date.parse(`${date}T00:00:00Z`) - Date.now()) / 86400000); return days < 0 ? "Đã hết hạn" : days < 90 ? "HSD còn < 90 ngày" : ""; };

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [view, setView] = useState<"home" | "products" | "bulk" | "orders" | "settings">("home");
  const [orderStatus, setOrderStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [orderDetail, setOrderDetail] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [qrMedia, setQrMedia] = useState<number[]>([]);
  const [savingCell, setSavingCell] = useState("");
  const [bulk, setBulk] = useState<Record<number, Partial<Product>>>({});
  const [bulkErrors, setBulkErrors] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin");
    if (response.status === 401) return location.reload();
    const data = await response.json();
    setProducts(data.products ?? []);
    setCategories(data.categories ?? []);
    setOrders(data.orders ?? []);
    setSettings(data.settings ?? null);
    setMessages(data.messages ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => products.filter(({ name }) => name.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN"))), [products, search]);
  const filteredOrders = orders.filter(({ status }) => orderStatus === "ALL" || status === orderStatus);
  const flash = (message: string) => { setNotice(message); setTimeout(() => setNotice(""), 2500); };
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
    if (!confirm(`Xóa sản phẩm “${product.name}”?`)) return;
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

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (qrMedia.length) { const response = await fetch("/api/admin/media"); const data = await response.json(); payload.vietQrUrl = data.media.find((item: { id: number }) => item.id === qrMedia[0])?.url ?? payload.vietQrUrl; }
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) return flash(data.error ?? "Không thể lưu cấu hình");
    setSettings(data.settings);
    flash("Đã lưu cấu hình cửa hàng");
  };

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <a href="/" className={styles.logo}><img src={settings ? mergeSiteContent(settings.siteContent).brand.logo : defaultSiteContent.brand.logo} alt={settings ? mergeSiteContent(settings.siteContent).brand.name : defaultSiteContent.brand.name}/></a>
      <p>ADMIN CONSOLE</p>
      <nav className={styles.adminNav}>
        <button className={view === "home" ? styles.activeNav : ""} onClick={() => setView("home")}>Tổng quan</button>
        <button className={view === "products" ? styles.activeNav : ""} onClick={() => setView("products")}>Sản phẩm {!loading && <small>{products.length}</small>}</button>
        <button className={view === "bulk" ? styles.activeNav : ""} onClick={() => setView("bulk")}>Sửa hàng loạt</button>
        <button className={view === "orders" ? styles.activeNav : ""} onClick={() => setView("orders")}>Đơn hàng <small>{orders.length}</small></button>
        <button className={view === "settings" ? styles.activeNav : ""} onClick={() => setView("settings")}>Cấu hình</button>
        <a href="/admin/danh-muc">Danh mục</a><a href="/admin/giao-dien">Giao diện & Nội dung</a><a href="/admin/tin-tuc">Tin tức</a><a href="/admin/thu-vien-anh">Thư viện ảnh</a><a href="/admin/danh-gia">Đánh giá</a><a href="/admin/ma-giam-gia">Mã giảm giá</a><a href="/admin/khach-hang">Khách hàng</a>
      </nav>
      <div className={styles.sideBottom}><a href="/">← Xem cửa hàng</a><form action="/api/admin/logout" method="post"><button>Đăng xuất</button></form></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}><div><p>QUẢN TRỊ CỬA HÀNG</p><h1>{view === "home" ? "Tổng quan" : view === "products" ? "Sản phẩm" : view === "bulk" ? "Sửa hàng loạt" : view === "orders" ? "Đơn hàng" : "Cấu hình"}</h1></div>{view === "products" && <button className={styles.primary} onClick={() => { setError(""); setEditing(null); }}>＋ THÊM SẢN PHẨM</button>}</header>
      {notice && <div className={styles.notice}>✓ {notice}</div>}

      {view === "home" && <section className={styles.panel}><div className="admin-metrics"><button onClick={() => setView("orders")}><small>Doanh thu hôm nay</small><strong>{money(orders.filter((order) => order.status !== "HUY" && new Date(order.createdAt).toDateString() === new Date().toDateString()).reduce((sum, order) => sum + order.total, 0))}</strong></button><button onClick={() => { setOrderStatus("MOI"); setView("orders"); }}><small>Đơn chờ xử lý</small><strong>{orders.filter((order) => order.status === "MOI").length}</strong></button><button onClick={() => setView("orders")}><small>Đơn COD chưa hoàn thành</small><strong>{orders.filter((order) => order.paymentMethod === "COD" && !["HUY", "HOAN_THANH"].includes(order.status)).length}</strong></button><button onClick={() => setView("products")}><small>Sản phẩm sắp hết hàng</small><strong>{products.filter((product) => product.trackInventory && (product.variantRows.length ? product.variantRows.some((row) => row.quantity <= 5) : product.inventoryQuantity <= 5)).length}</strong></button></div><h2>5 đơn mới nhất</h2>{orders.slice(0, 5).map((order) => <button className={styles.orderRow} key={order.id} onClick={() => void openOrder(order.id)}><span>{order.code}</span><span>{order.customerName}</span><span>{money(order.total)}</span><span>{statusLabels[order.status]}</span></button>)}</section>}

      {view === "products" && <><section className={styles.importPanel}>
        <div><p>NHẬP NHANH</p><h2>Nhập sản phẩm từ CSV</h2><span>Tạo mới hoặc cập nhật theo tên sản phẩm. File sai sẽ không ghi dữ liệu.</span></div>
        <form onSubmit={importCsv}><input required type="file" name="file" accept=".csv,text/csv"/><button type="submit">NHẬP CSV</button><a href="/products-sample.csv" download>Tải file mẫu 2 dòng</a></form>
        {!!csvErrors.length && <div className={styles.csvErrors}>{csvErrors.map((message) => <p key={message}>{message}</p>)}</div>}
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}><label>⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm..."/></label>{!loading && <span>{filtered.length} sản phẩm</span>}</div>
        {loading ? <div className={styles.productSkeleton} aria-label="Đang tải sản phẩm" role="status">{Array.from({ length: 5 }, (_, index) => <div className={styles.skeletonRow} key={index}><span/><span/><span/><span/></div>)}</div> : <div className={styles.productTable}>
          <div className={styles.tableHeader}><span>SẢN PHẨM</span><span>DANH MỤC</span><span>GIÁ</span><span>TỒN KHO</span><span>THAO TÁC</span></div>
          {filtered.map((product) => <div className={styles.productRow} key={product.id}>
            <span><img src={product.image} alt=""/><i><b>{product.name}</b><small>{product.brand} · /{product.slug}</small></i></span>
            <span>{product.categoryName ?? "Chưa chọn"}<small>{product.published ? "Đang bán" : "Bản nháp"}</small>{expiryWarning(product.expiryDate) && <small className={expiryWarning(product.expiryDate) === "Đã hết hạn" ? "expiry-expired" : "expiry-soon"}>{expiryWarning(product.expiryDate)}</small>}<label className="admin-toggle"><input type="checkbox" checked={product.published} onChange={(event) => void quick([{ id: product.id, published: event.target.checked }])}/> Đang bán</label></span><span><input aria-label={`Giá bán ${product.name}`} type="number" min="0" defaultValue={product.price} key={`${product.id}-${product.price}`} onKeyDown={(event) => { if (event.key === "Enter") void quick([{ id: product.id, price: Number(event.currentTarget.value) }]); }}/><button type="button" disabled={savingCell === String(product.id)} onClick={(event) => void quick([{ id: product.id, price: Number((event.currentTarget.previousElementSibling as HTMLInputElement).value) }])}>Lưu giá</button>{product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}</span>
            <span className={product.inStock ? styles.inStock : styles.outOfStock}>{product.variantRows.length ? <button type="button" onClick={() => setEditing(product)}>Sửa tồn biến thể</button> : <><input aria-label={`Tồn kho ${product.name}`} type="number" min="0" defaultValue={product.inventoryQuantity} key={`${product.id}-${product.inventoryQuantity}`} onKeyDown={(event) => { if (event.key === "Enter") void quick([{ id: product.id, inventoryQuantity: Number(event.currentTarget.value) }]); }}/><button type="button" disabled={savingCell === String(product.id)} onClick={(event) => void quick([{ id: product.id, inventoryQuantity: Number((event.currentTarget.previousElementSibling as HTMLInputElement).value) }])}>Lưu tồn</button></>}</span>
            <span><button onClick={() => { setError(""); setEditing(product); }}>Sửa</button><button onClick={() => void duplicateProduct(product)}>Nhân bản</button><button onClick={() => void deleteProduct(product)}>Xóa</button></span>
          </div>)}
          {!filtered.length && <div className={styles.empty}>Không tìm thấy sản phẩm.</div>}
        </div>}
      </section></>}

      {view === "bulk" && <section className={styles.panel}><p>Sửa nhiều dòng, sau đó lưu một lần. Dòng không hợp lệ sẽ được đánh dấu, dòng đúng vẫn lưu.</p><div className="admin-bulk-table"><div className="admin-bulk-head"><b>Tên</b><b>Giá bán</b><b>Giá gốc</b><b>Tồn kho</b><b>Đang bán</b></div>{products.map((product) => <div className={bulkErrors[product.id] ? "admin-bulk-row error" : "admin-bulk-row"} key={product.id}><span>{product.name}{bulkErrors[product.id] && <small role="alert">{bulkErrors[product.id]}</small>}</span>{(["price", "oldPrice", "inventoryQuantity"] as const).map((field) => <input key={field} aria-label={`${field} ${product.name}`} type="number" min="0" disabled={field === "inventoryQuantity" && !!product.variantRows.length} title={field === "inventoryQuantity" && product.variantRows.length ? "Sửa tồn từng biến thể trong trình sửa sản phẩm" : undefined} value={bulk[product.id]?.[field] ?? product[field]} onChange={(event) => setBulk((current) => ({ ...current, [product.id]: { ...current[product.id], [field]: Number(event.target.value) } }))}/>)}<input type="checkbox" aria-label={`Đang bán ${product.name}`} checked={bulk[product.id]?.published ?? product.published} onChange={(event) => setBulk((current) => ({ ...current, [product.id]: { ...current[product.id], published: event.target.checked } }))}/></div>)}</div><button className={styles.primary} type="button" disabled={savingCell === "bulk" || !Object.keys(bulk).length} onClick={() => void quick(Object.entries(bulk).map(([id, fields]) => ({ id: Number(id), price: fields.price, oldPrice: fields.oldPrice, inventoryQuantity: fields.inventoryQuantity, published: fields.published })))}>{savingCell === "bulk" ? "Đang lưu..." : "Lưu tất cả"}</button></section>}

      {view === "orders" && <section className={styles.panel}>
        <div className={styles.toolbar}><select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value as "ALL" | OrderStatus)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span>{filteredOrders.length} đơn hàng</span></div>
        <div className={styles.orderTable}>
          <div className={styles.orderHeader}><span>MÃ ĐƠN</span><span>KHÁCH HÀNG</span><span>TỔNG TIỀN</span><span>THANH TOÁN</span><span>TRẠNG THÁI</span></div>
          {filteredOrders.map((order) => <button className={styles.orderRow} key={order.id} onClick={() => void openOrder(order.id)}><span><b>{order.code}</b><small>{new Date(order.createdAt).toLocaleString("vi-VN")}</small></span><span><b>{order.customerName}</b><small>{order.phone}</small></span><span>{money(order.total)}</span><span>{order.paymentMethod === "COD" ? "COD" : "Chuyển khoản"}</span><span>{statusLabels[order.status]}</span></button>)}
          {!filteredOrders.length && <div className={styles.empty}>Chưa có đơn hàng.</div>}
        </div>
      </section>}

      {view === "settings" && settings && <section className={styles.panel}><form className={styles.settingsForm} onSubmit={saveSettings}>
        <label>TIÊU ĐỀ FLASH SALE<input name="flashSaleTitle" maxLength={100} defaultValue={settings.flashSaleTitle}/></label>
        <label>BẮT ĐẦU FLASH SALE<input type="datetime-local" name="flashSaleStart" defaultValue={dateInput(settings.flashSaleStart)}/></label>
        <label>KẾT THÚC FLASH SALE<input type="datetime-local" name="flashSaleEnd" defaultValue={dateInput(settings.flashSaleEnd)}/></label>
        <label>MIỄN PHÍ SHIP TỪ<input required min="0" type="number" name="freeShippingThreshold" defaultValue={settings.freeShippingThreshold}/></label>
        <label>PHÍ SHIP TIÊU CHUẨN<input required min="0" type="number" name="standardShippingFee" defaultValue={settings.standardShippingFee}/></label>
        <label>NGÂN HÀNG<input name="bankName" maxLength={150} defaultValue={settings.bankName}/></label>
        <label>CHỦ TÀI KHOẢN<input name="bankAccountName" maxLength={150} defaultValue={settings.bankAccountName}/></label>
        <label>SỐ TÀI KHOẢN<input name="bankAccountNumber" maxLength={50} defaultValue={settings.bankAccountNumber}/></label>
        <label>ẢNH VIETQR <MediaPicker selected={qrMedia} onChange={setQrMedia} multiple={false}/><input name="vietQrUrl" type="url" maxLength={2000} defaultValue={settings.vietQrUrl} placeholder="URL cũ (dự phòng)"/></label>
        <label className={styles.full}>EMAIL NHẬN THÔNG BÁO ĐƠN<input name="shopEmail" type="email" maxLength={255} defaultValue={settings.shopEmail}/></label>
        <label className={styles.full}>NỘI DUNG GIỚI THIỆU<textarea name="aboutContent" required rows={7} defaultValue={settings.aboutContent}/></label>
        <input type="hidden" name="contactContent" value={settings.contactContent}/>
        <label className={styles.full}>CHÍNH SÁCH BẢO MẬT<textarea name="privacyPolicy" required rows={7} defaultValue={settings.privacyPolicy}/></label>
        <label className={styles.full}>CHÍNH SÁCH VẬN CHUYỂN<textarea name="shippingPolicy" required rows={7} defaultValue={settings.shippingPolicy}/></label>
        <label className={styles.full}>CHÍNH SÁCH ĐỔI TRẢ<textarea name="returnsPolicy" required rows={7} defaultValue={settings.returnsPolicy}/></label>
        <label className={styles.full}>ĐIỀU KHOẢN<textarea name="termsPolicy" required rows={7} defaultValue={settings.termsPolicy}/></label>
        <button className={styles.primary} type="submit">LƯU CẤU HÌNH</button>
      </form><div className={styles.messages}><h2>Lời nhắn liên hệ</h2>{messages.map((item) => <article key={item.id}><b>{item.name}</b><small>{item.email}{item.phone ? ` · ${item.phone}` : ""} · {new Date(item.createdAt).toLocaleString("vi-VN")}</small><p>{item.message}</p></article>)}{!messages.length && <p>Chưa có lời nhắn.</p>}</div></section>}
    </main>

    {editing !== undefined && <ProductEditor key={editing?.id ?? "new"} product={editing} categories={categories} badges={[...new Set(products.map((item) => item.badge).filter((item): item is string => !!item))]} onClose={() => setEditing(undefined)} onSaved={() => { void load(); setEditing(undefined); flash("Đã lưu sản phẩm"); }}/>
    }

    {orderDetail && <div className={styles.modalBack} onMouseDown={() => setOrderDetail(null)}><section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
      <div className={styles.modalHead}><div><p>CHI TIẾT ĐƠN HÀNG</p><h2>{orderDetail.order.code}</h2></div><button type="button" onClick={() => setOrderDetail(null)}>×</button></div>
      <div className={styles.orderInfo}><p><b>{orderDetail.order.customerName}</b><br/>{orderDetail.order.phone} · {orderDetail.order.email}</p><p>{orderDetail.order.address}, {orderDetail.order.district}, {orderDetail.order.city}</p>{orderDetail.order.note && <p>Ghi chú: {orderDetail.order.note}</p>}<p>Thanh toán: {orderDetail.order.paymentMethod === "COD" ? "COD" : "Chuyển khoản"}</p></div>
      <div className={styles.orderItems}>{orderDetail.items.map((item) => <p key={item.id}><span>{item.productName}{item.variantName && ` · ${item.variantName}`} × {item.quantity}</span><b>{money(item.price * item.quantity)}</b></p>)}</div>
      <div className={styles.orderTotals}><p><span>Tạm tính</span><b>{money(orderDetail.order.subtotal)}</b></p><p><span>Phí ship</span><b>{money(orderDetail.order.shippingFee)}</b></p><p><span>Giảm giá</span><b>−{money(orderDetail.order.discount)}</b></p><p><span>Tổng cộng</span><b>{money(orderDetail.order.total)}</b></p></div>
      {!!nextStatuses[orderDetail.order.status].length && <div className={styles.statusActions}>{nextStatuses[orderDetail.order.status].map((status) => <button className={styles.primary} key={status} onClick={() => void changeOrderStatus(orderDetail.order.id, status)}>{statusLabels[status]}</button>)}</div>}
    </section></div>}
  </div>;
}
