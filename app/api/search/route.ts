import { z } from "zod";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { getStoreCatalog } from "@/db/store";
import { visibleCategories } from "@/lib/categories";

const querySchema = z.string().trim().max(100);

export async function GET(request: Request) {
  if (checkoutRateLimited(`search:${requestClient(request)}`)) return Response.json({ error: "Bạn tìm kiếm quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  const query = querySchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  if (!query.success) return Response.json({ error: "Từ khóa không hợp lệ" }, { status: 400 });
  const catalog = await getStoreCatalog();
  const categories = visibleCategories(catalog.categoryTree);
  const brands = [...new Set(catalog.products.map((product) => product.brand).filter(Boolean))];
  if (!query.data) {
    const popularBrands = brands.sort((a, b) => catalog.products.filter((item) => item.brand === b).length - catalog.products.filter((item) => item.brand === a).length).slice(0, 3);
    return Response.json({ products: [], brands: popularBrands, categories: categories.filter((item) => !item.parentId).slice(0, 6).map(({ name, slug }) => ({ name, slug })) });
  }
  if (query.data.length < 2) return Response.json({ products: [], brands: [], categories: [] });
  const needle = query.data.toLocaleLowerCase("vi-VN");
  return Response.json({
    products: catalog.products.filter((item) => `${item.name} ${item.brand}`.toLocaleLowerCase("vi-VN").includes(needle)).slice(0, 6).map(({ name, slug, image, price, brand }) => ({ name, slug, image, price, brand })),
    brands: brands.filter((brand) => brand.toLocaleLowerCase("vi-VN").includes(needle)).slice(0, 3),
    categories: categories.filter((item) => item.name.toLocaleLowerCase("vi-VN").includes(needle)).slice(0, 3).map(({ name, slug }) => ({ name, slug })),
  });
}
