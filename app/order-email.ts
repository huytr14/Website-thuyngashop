type OrderEmail = { code: string; customerName: string; customerEmail: string; total: number; shopEmail: string; paymentMethod: string; bankName: string; bankAccountName: string; bankAccountNumber: string; items: { productName: string; variantName: string | null; price: number; quantity: number }[] };

export async function sendOrderEmails(order: OrderEmail) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.info(`[email:simulated] Confirmation and shop notification for order ${order.code}`);
    return;
  }

  const from = process.env.EMAIL_FROM;
  const items = `<ul>${order.items.map((item) => `<li>${escapeHtml(item.productName)}${item.variantName ? ` — ${escapeHtml(item.variantName)}` : ""} × ${item.quantity}: ${(item.price * item.quantity).toLocaleString("vi-VN")}₫</li>`).join("")}</ul>`;
  const bank = order.paymentMethod === "BANK_TRANSFER" && order.bankAccountNumber ? `<p>Chuyển khoản ${escapeHtml(order.bankName)} — ${escapeHtml(order.bankAccountNumber)} — ${escapeHtml(order.bankAccountName)}; nội dung: <strong>${escapeHtml(order.code)}</strong>.</p>` : "";
  const messages = [
    { to: [order.customerEmail], subject: `Xác nhận đơn hàng ${order.code}`, html: `<p>Xin chào ${escapeHtml(order.customerName)},</p><p>THUYNGA Shop đã nhận đơn <strong>${escapeHtml(order.code)}</strong>:</p>${items}<p>Tổng thanh toán: <strong>${order.total.toLocaleString("vi-VN")}₫</strong>.</p>${bank}` },
    ...(order.shopEmail ? [{ to: [order.shopEmail], subject: `Đơn hàng mới ${order.code}`, html: `<p>Có đơn hàng mới <strong>${escapeHtml(order.code)}</strong>:</p>${items}<p>Tổng thanh toán: <strong>${order.total.toLocaleString("vi-VN")}₫</strong>.</p>` }] : []),
  ];

  for (const message of messages) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, ...message }),
    });
    if (!response.ok) throw new Error(`Resend returned ${response.status}`);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}
