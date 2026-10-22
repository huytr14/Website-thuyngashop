"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setSending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? ""); const password = String(form.get("password") ?? "");
    if (mode === "register") {
      const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Không thể đăng ký"); setSending(false); return; }
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError(mode === "login" ? "Email hoặc mật khẩu không đúng" : "Đã đăng ký nhưng chưa thể đăng nhập"); setSending(false); return; }
    location.assign("/tai-khoan");
  };

  return <form className="auth-card" onSubmit={submit}>
    <p className="eyebrow">THUYNGA MEMBER</p><h1>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
    {mode === "register" && <label>HỌ VÀ TÊN<input name="name" required minLength={2} maxLength={150}/></label>}
    <label>EMAIL<input name="email" type="email" required maxLength={255} autoComplete="email"/></label>
    <label>MẬT KHẨU<input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"}/></label>
    {error && <p className="form-message error">{error}</p>}
    <button disabled={sending}>{sending ? "ĐANG XỬ LÝ..." : mode === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}</button>
    <a href={mode === "login" ? "/dang-ky" : "/dang-nhap"}>{mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}</a>
  </form>;
}
