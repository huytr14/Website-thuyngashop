export type VoucherValue = { type: "PERCENT" | "FIXED" | "FREESHIP"; value: number };
export type VoucherRule = VoucherValue & { active: boolean; minOrder: number; startsAt?: Date | null; expiresAt: Date | null; usageLimit: number | null; usedCount: number };
export type OrderStatus = "MOI" | "DA_XAC_NHAN" | "DANG_GIAO" | "HOAN_THANH" | "HUY";

export function shippingFee(subtotal: number, threshold: number, fee: number) {
  return subtotal >= threshold ? 0 : fee;
}

export function voucherDiscount(voucher: VoucherValue | null, subtotal: number, shipping: number) {
  if (!voucher) return 0;
  if (voucher.type === "FREESHIP") return shipping;
  if (voucher.type === "PERCENT") return Math.min(subtotal, Math.floor(subtotal * voucher.value / 100));
  return Math.min(subtotal, voucher.value);
}

export function voucherError(voucher: VoucherRule | undefined, subtotal: number, now = new Date()) {
  if (!voucher || !voucher.active) return "Mã giảm giá không tồn tại hoặc đã tắt";
  if (voucher.startsAt && voucher.startsAt > now) return "Mã giảm giá chưa bắt đầu";
  if (voucher.expiresAt && voucher.expiresAt <= now) return "Mã giảm giá đã hết hạn";
  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) return "Mã giảm giá đã hết lượt sử dụng";
  if (subtotal < voucher.minOrder) return `Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString("vi-VN")}₫`;
  if (voucher.type === "PERCENT" && (voucher.value < 1 || voucher.value > 100)) return "Mã giảm giá không hợp lệ";
  if (voucher.type === "FIXED" && voucher.value < 1) return "Mã giảm giá không hợp lệ";
  if (!(["PERCENT", "FIXED", "FREESHIP"] as string[]).includes(voucher.type)) return "Mã giảm giá không hợp lệ";
  return null;
}

export function orderCode(now = new Date(), random = Math.random()) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now).replaceAll("-", "");
  return `TNG-${date}-${Math.floor(random * 36 ** 4).toString(36).padStart(4, "0").toUpperCase()}`;
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  MOI: ["DA_XAC_NHAN", "HUY"],
  DA_XAC_NHAN: ["DANG_GIAO", "HUY"],
  DANG_GIAO: ["HOAN_THANH", "HUY"],
  HOAN_THANH: [],
  HUY: [],
};

export function canChangeOrderStatus(from: OrderStatus, to: OrderStatus) {
  return transitions[from].includes(to);
}
