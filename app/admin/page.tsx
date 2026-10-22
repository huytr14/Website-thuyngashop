import { hasAdminSession } from "@/app/admin-auth";
import AdminDashboard from "./AdminDashboard";
import styles from "./admin.module.css";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; rate?: string }> }) {
  if (await hasAdminSession()) return <AdminDashboard />;
  const { error, rate } = await searchParams;

  return <main className={styles.loginPage}>
    <form className={styles.loginCard} action="/api/admin/login" method="post">
      <a href="/" className={styles.loginLogo}><img src="/thuynga-logo-wine.png" alt="THUYNGA Shop"/></a>
      <p>TRANG QUẢN TRỊ</p>
      <h1>Đăng nhập</h1>
      <label>MẬT KHẨU<input name="password" type="password" required autoComplete="current-password" autoFocus/></label>
      {error && <div className={styles.formError}>Mật khẩu không đúng.</div>}
      {rate && <div className={styles.formError}>Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.</div>}
      {!process.env.ADMIN_PASSWORD && <div className={styles.formError}>ADMIN_PASSWORD chưa được cấu hình.</div>}
      <button type="submit" disabled={!process.env.ADMIN_PASSWORD}>ĐĂNG NHẬP</button>
      <a href="/">← Quay lại cửa hàng</a>
    </form>
  </main>;
}
