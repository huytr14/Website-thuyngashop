"use client";

import { useState } from "react";

export default function ContactForm({ siteKey }: { siteKey: string }) {
  const [message, setMessage] = useState(""); const [sending, setSending] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSending(true); setMessage(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), phone: form.get("phone"), message: form.get("message"), turnstileToken: form.get("cf-turnstile-response") }) });
    const data = await response.json(); setSending(false); setMessage(response.ok ? "Cảm ơn bạn. THUYNGA Shop đã nhận được lời nhắn." : data.error ?? "Không thể gửi lời nhắn"); if (response.ok) event.currentTarget.reset();
  };
  return <form className="simple-form contact-form" onSubmit={submit}><input name="name" required minLength={2} maxLength={150} placeholder="Họ và tên"/><input name="email" type="email" required maxLength={255} placeholder="Email"/><input name="phone" maxLength={30} placeholder="Số điện thoại"/><textarea name="message" required minLength={10} maxLength={3000} placeholder="Nội dung cần tư vấn"/>{siteKey && <><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer/><div className="cf-turnstile" data-sitekey={siteKey}/></>}<button disabled={sending}>{sending ? "ĐANG GỬI..." : "GỬI LỜI NHẮN"}</button>{message && <p className="form-message">{message}</p>}</form>;
}
