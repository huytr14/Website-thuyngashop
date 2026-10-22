import { z } from "zod";

export const cartItemsSchema = z.array(z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99),
})).min(1).max(50).refine((items) => new Set(items.map(({ productId }) => productId)).size === items.length, "Giỏ hàng có sản phẩm trùng lặp");

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(150),
  email: z.email().max(255),
  phone: z.string().trim().regex(/^0\d{8,10}$/, "Số điện thoại không hợp lệ"),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  note: z.string().trim().max(1000).optional().default(""),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
  voucherCode: z.string().trim().max(50).optional().default("").transform((value) => value.toUpperCase()),
  items: cartItemsSchema,
});
