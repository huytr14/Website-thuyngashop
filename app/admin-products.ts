import { z } from "zod";
import { sanitizeRichText } from "../lib/sanitize-rich-text.ts";

const image = z.string().trim().refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), "Ảnh phải là URL http(s) hoặc đường dẫn bắt đầu bằng /");

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc").max(200).refine((value) => !/thuốc|thuoc|dayquil|nyquil/i.test(value), "Cửa hàng không bán thuốc"),
  slug: z.string().trim().max(200).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  slugCustom: z.boolean().default(false),
  brand: z.string().trim().max(100),
  origin: z.enum(["Mỹ", "Nhật Bản", "Hàn Quốc", "Úc", "Đức", "Pháp", "Khác"]).nullable().default(null),
  specification: z.string().trim().max(150).default(""),
  expiryDate: z.iso.date().nullable().default(null),
  price: z.coerce.number().int().nonnegative("Giá bán không hợp lệ"),
  oldPrice: z.coerce.number().int().nonnegative("Giá gốc không hợp lệ"),
  image,
  extraImages: z.array(image).max(20),
  shortDescription: z.string().trim().max(500),
  description: z.string().trim().max(10000).transform(sanitizeRichText),
  variant: z.string().trim().max(500),
  inStock: z.boolean(),
  badge: z.string().trim().max(50).nullable(),
  categoryId: z.union([z.coerce.number().int().positive(), z.null()]),
  published: z.boolean().default(false),
  trackInventory: z.boolean().default(false),
  inventoryQuantity: z.coerce.number().int().nonnegative().default(0),
  variantOptions: z.array(z.object({ name: z.string().trim().min(1), values: z.array(z.string().trim().min(1)) })).default([]),
  variantRows: z.array(z.object({ name: z.string().trim().min(1).max(300), price: z.coerce.number().int().nonnegative(), quantity: z.coerce.number().int().nonnegative(), image: image.optional() })).default([]),
  flashPrice: z.coerce.number().int().nonnegative().nullable().default(null),
  flashStock: z.coerce.number().int().nonnegative().nullable().default(null),
  seoTitle: z.string().trim().max(200).default(""),
  seoDescription: z.string().trim().max(500).default(""),
  mediaIds: z.array(z.number().int().positive()).max(21).default([]),
}).superRefine((value, context) => {
  const combinations = value.variantOptions.reduce<string[]>((current, option) => current.flatMap((prefix) => option.values.map((tag) => [prefix, tag].filter(Boolean).join(" / "))), [""]).filter(Boolean);
  if (value.variantRows.length && (value.variantRows.length !== combinations.length || value.variantRows.some((row) => !combinations.includes(row.name)))) context.addIssue({ code: "custom", path: ["variantRows"], message: "Dòng biến thể không khớp thuộc tính" });
  if (value.flashPrice !== null && value.flashPrice === 0) context.addIssue({ code: "custom", path: ["flashPrice"], message: "Giá Flash phải lớn hơn 0" });
  if (value.oldPrice && value.oldPrice < value.price) context.addIssue({ code: "custom", path: ["oldPrice"], message: "Giá gốc phải lớn hơn hoặc bằng giá bán" });
  if (value.published && !value.price) context.addIssue({ code: "custom", path: ["price"], message: "Đang bán cần giá bán > 0" });
  if (value.published && !(value.image || value.mediaIds.length)) context.addIssue({ code: "custom", path: ["image"], message: "Đang bán cần ít nhất 1 ảnh" });
  if (value.published && !value.categoryId) context.addIssue({ code: "custom", path: ["categoryId"], message: "Đang bán cần danh mục" });
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const csvHeaders = ["ten_san_pham", "danh_muc", "thuong_hieu", "gia_ban", "gia_goc", "link_anh_chinh", "anh_phu", "mo_ta_ngan", "mo_ta_chi_tiet", "bien_the", "con_hang"] as const;

export function slugify(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (quoted) throw new Error("Dấu ngoặc kép trong CSV chưa được đóng");
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((values) => values.some((value) => value.trim()));
}

const csvRowSchema = z.object({
  ten_san_pham: z.string().trim().min(1, "Thiếu tên sản phẩm"),
  danh_muc: z.string().trim().min(1, "Thiếu danh mục"),
  thuong_hieu: z.string().trim().min(1, "Thiếu thương hiệu"),
  gia_ban: z.coerce.number().int().nonnegative("Giá bán không hợp lệ"),
  gia_goc: z.coerce.number().int().nonnegative("Giá gốc không hợp lệ"),
  link_anh_chinh: image,
  anh_phu: z.string(),
  mo_ta_ngan: z.string().max(500),
  mo_ta_chi_tiet: z.string().max(10000),
  bien_the: z.string().max(500),
  con_hang: z.string().trim().transform((value, context) => {
    const normalized = value.toLowerCase();
    if (["1", "true", "yes", "có", "co"].includes(normalized)) return true;
    if (["0", "false", "no", "không", "khong"].includes(normalized)) return false;
    context.addIssue({ code: "custom", message: "con_hang phải là true/false, 1/0, có/không hoặc yes/no" });
    return z.NEVER;
  }),
}).refine(({ gia_goc, gia_ban }) => gia_goc >= gia_ban, { message: "Giá gốc phải lớn hơn hoặc bằng giá bán", path: ["gia_goc"] });

export type CsvProduct = ProductInput & { categoryName: string; line: number };

export function parseProductCsv(text: string): { products: CsvProduct[]; errors: string[] } {
  let rows: string[][];
  try { rows = parseCsv(text.replace(/^\uFEFF/, "")); }
  catch (error) { return { products: [], errors: [(error as Error).message] }; }
  if (!rows.length) return { products: [], errors: ["File CSV trống"] };

  const headers = rows[0].map((value) => value.trim());
  const missing = csvHeaders.filter((header) => !headers.includes(header));
  const extra = headers.filter((header) => !csvHeaders.includes(header as typeof csvHeaders[number]));
  if (missing.length || extra.length || headers.length !== csvHeaders.length) {
    return { products: [], errors: [`Cột CSV không hợp lệ. Thiếu: ${missing.join(", ") || "không"}; thừa: ${extra.join(", ") || "không"}`] };
  }

  const products: CsvProduct[] = [];
  const errors: string[] = [];
  const seenNames = new Set<string>();
  const seenSlugs = new Set<string>();
  for (let index = 1; index < rows.length; index++) {
    const values = rows[index];
    if (values.length !== headers.length) { errors.push(`Dòng ${index + 1}: có ${values.length} ô, cần ${headers.length}`); continue; }
    const parsed = csvRowSchema.safeParse(Object.fromEntries(headers.map((header, position) => [header, values[position]])));
    if (!parsed.success) { errors.push(`Dòng ${index + 1}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`); continue; }
    const data = parsed.data;
    const slug = slugify(data.ten_san_pham);
    const nameKey = data.ten_san_pham.toLocaleLowerCase("vi-VN");
    if (!slug) { errors.push(`Dòng ${index + 1}: không thể tạo slug từ tên sản phẩm`); continue; }
    if (seenNames.has(nameKey) || seenSlugs.has(slug)) { errors.push(`Dòng ${index + 1}: tên hoặc slug bị trùng trong file`); continue; }
    seenNames.add(nameKey); seenSlugs.add(slug);
    const product = productInputSchema.safeParse({
      line: index + 1,
      name: data.ten_san_pham,
      slug,
      brand: data.thuong_hieu,
      price: data.gia_ban,
      oldPrice: data.gia_goc,
      image: data.link_anh_chinh,
      extraImages: data.anh_phu.split(/[|;]/).map((value) => value.trim()).filter(Boolean),
      shortDescription: data.mo_ta_ngan,
      description: data.mo_ta_chi_tiet,
      variant: data.bien_the,
      inStock: data.con_hang,
      badge: null,
      categoryId: 1,
      published: true,
    });
    if (!product.success) { errors.push(`Dòng ${index + 1}: ${product.error.issues.map((issue) => issue.message).join("; ")}`); continue; }
    products.push({ ...product.data, line: index + 1, categoryName: data.danh_muc });
  }
  return { products, errors };
}
