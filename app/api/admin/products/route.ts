import { hasAdminSession } from "@/app/admin-auth";
import { revalidatePath } from "next/cache";
import { productInputSchema } from "@/app/admin-products";
import { saveProduct } from "@/db/save-product";
import { fieldIssue, invalidFields } from "@/lib/admin-validation";

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidFields(parsed.error);
  try {
    const product = await saveProduct(parsed.data);
    revalidatePath("/"); revalidatePath("/san-pham/[slug]", "page"); revalidatePath("/danh-muc/[slug]", "page");
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return fieldIssue("slug", "Slug sản phẩm đã tồn tại", 409);
    if (error instanceof Error && ["Danh mục không tồn tại", "Ảnh trong kho không hợp lệ", "Không thể tạo slug từ tên sản phẩm"].includes(error.message)) return fieldIssue(error.message === "Danh mục không tồn tại" ? "categoryId" : error.message === "Ảnh trong kho không hợp lệ" ? "mediaIds" : "name", error.message);
    throw error;
  }
}
