type OrderEmail = { code: string; customerName: string; customerEmail: string; total: number; shopEmail: string };

export async function sendOrderEmails(order: OrderEmail) {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[email:simulated] Confirmation and shop notification for order ${order.code}`);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "THUYNGA Shop <onboarding@resend.dev>";
  const messages = [
    { to: [order.customerEmail], subject: `Xác nhận đơn hàng ${order.code}`, html: `<p>Xin chào ${escapeHtml(order.customerName)},</p><p>THUYNGA Shop đã nhận đơn <strong>${order.code}</strong> trị giá <strong>${order.total.toLocaleString("vi-VN")}₫</strong>.</p>` },
    ...(order.shopEmail ? [{ to: [order.shopEmail], subject: `Đơn hàng mới ${order.code}`, html: `<p>Có đơn hàng mới <strong>${order.code}</strong>, tổng tiền <strong>${order.total.toLocaleString("vi-VN")}₫</strong>.</p>` }] : []),
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
