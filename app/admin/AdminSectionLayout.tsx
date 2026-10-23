import styles from "./admin.module.css";
import "./editor.css";

export default function AdminSectionLayout({ title, children }: { title: string; children: React.ReactNode }) { return <div className={styles.shell}><aside className={styles.sidebar}><a href="/" className={styles.logo}><img src="/thuynga-logo-wine.png" alt="THUYNGA Shop"/></a><p>ADMIN CONSOLE</p><nav className={styles.adminNav}><a href="/admin">Sản phẩm & đơn hàng</a><a href="/admin/tin-tuc">Tin tức</a><a href="/admin/thu-vien-anh">Thư viện ảnh</a><a href="/admin/danh-gia">Đánh giá</a></nav><div className={styles.sideBottom}><a href="/">← Xem cửa hàng</a></div></aside><main className={styles.main}><header className={styles.topbar}><div><p>QUẢN TRỊ CỬA HÀNG</p><h1>{title}</h1></div></header>{children}</main></div>; }
