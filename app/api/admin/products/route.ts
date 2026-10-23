import { hasAdminSession } from "@/app/admin-auth";
import { productInputSchema } from "@/app/admin-products";
import { saveProduct } from "@/db/save-product";

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
  try {
    const product = await saveProduct(parsed.data);
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return Response.json({ error: "Slug sản phẩm đã tồn tại" }, { status: 409 });
    if (error instanceof Error && ["Danh mục không tồn tại", "Ảnh trong kho không hợp lệ", "Không thể tạo slug từ tên sản phẩm"].includes(error.message)) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
