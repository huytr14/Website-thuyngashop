export const categories = [
  { name: "Chăm sóc da", slug: "cham-soc-da" },
  { name: "Trang điểm", slug: "trang-diem" },
  { name: "Tóc & cơ thể", slug: "toc-co-the" },
] as const;

export type Product = {
  id: number;
  name: string;
  slug: string;
  brand: string;
  price: number;
  oldPrice: number;
  image: string;
  extraImages: string[];
  shortDescription: string;
  description: string;
  variant: string;
  inStock: boolean;
  badge?: string;
  category: string;
};

type BaseProduct = Pick<Product, "id" | "brand" | "name" | "price" | "oldPrice" | "image" | "badge">;

const baseProducts: BaseProduct[] = [
  { id: 1, brand: "SHISEIDO", name: "Eudermine Activating Essence", price: 2780000, oldPrice: 3850000, image: "/shiseido-eudermine-reference.png", badge: "NỔI BẬT" },
  { id: 2, brand: "SKINCARE", name: "Sữa rửa mặt dịu nhẹ", price: 998000, oldPrice: 1320000, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=720&q=85" },
  { id: 3, brand: "SKINCARE", name: "Bộ chăm sóc da phục hồi", price: 1599000, oldPrice: 2300000, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=720&q=85", badge: "MỚI" },
  { id: 4, brand: "HAIR & BODY", name: "Tinh dầu chăm sóc tóc", price: 1250000, oldPrice: 1690000, image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=720&q=85" },
  { id: 5, brand: "SKINCARE", name: "Tinh chất dưỡng da hằng ngày", price: 2190000, oldPrice: 2950000, image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=720&q=85" },
  { id: 6, brand: "SKINCARE", name: "Mặt nạ ngủ cấp ẩm", price: 579000, oldPrice: 760000, image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=720&q=85" },
  { id: 7, brand: "SKINCARE", name: "Tinh chất dưỡng sáng làn da", price: 2450000, oldPrice: 3200000, image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=720&q=85" },
  { id: 8, brand: "SKINCARE", name: "Nước dưỡng da cân bằng", price: 2990000, oldPrice: 3850000, image: "https://images.unsplash.com/photo-1591130901921-3f0652bb3915?auto=format&fit=crop&w=720&q=85" },
  { id: 9, brand: "SKINCARE", name: "Serum chăm sóc da đều màu", price: 1390000, oldPrice: 1750000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=720&q=85", badge: "NEW IN" },
  { id: 10, brand: "SKINCARE", name: "Kem dưỡng ẩm mềm mịn", price: 1120000, oldPrice: 1480000, image: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=720&q=85" },
  { id: 11, brand: "SKINCARE", name: "Tinh dầu dưỡng da căng bóng", price: 890000, oldPrice: 1120000, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=720&q=85", badge: "GỢI Ý" },
  { id: 12, brand: "SKINCARE", name: "Nước làm sạch dịu nhẹ", price: 445000, oldPrice: 590000, image: "https://images.unsplash.com/photo-1611930021592-a8cfd5319ceb?auto=format&fit=crop&w=720&q=85" },
  { id: 13, brand: "SKINCARE", name: "Bộ chăm sóc da chuyên sâu", price: 2650000, oldPrice: 3450000, image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=720&q=85", badge: "NỔI BẬT" },
  { id: 14, brand: "MAKEUP", name: "Son môi sắc đỏ cổ điển", price: 825000, oldPrice: 1050000, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=720&q=85" },
  { id: 15, brand: "SKINCARE", name: "Tinh chất dưỡng ẩm tươi mát", price: 760000, oldPrice: 980000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=720&q=85", badge: "MỚI" },
  { id: 16, brand: "HAIR & BODY", name: "Sữa dưỡng thể mềm mượt", price: 685000, oldPrice: 850000, image: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=720&q=85" },
  { id: 17, brand: "SKINCARE", name: "Tinh chất chăm sóc da rạng rỡ", price: 2290000, oldPrice: 2890000, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=720&q=85", badge: "NỔI BẬT" },
  { id: 18, brand: "SKINCARE", name: "Kem dưỡng da hằng ngày", price: 485000, oldPrice: 620000, image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=720&q=85" },
  { id: 19, brand: "SKINCARE", name: "Bộ dưỡng da êm dịu", price: 950000, oldPrice: 1250000, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=720&q=85" },
  { id: 20, brand: "SKINCARE", name: "Kem làm sạch và dưỡng ẩm", price: 880000, oldPrice: 1120000, image: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=720&q=85" },
  { id: 21, brand: "SKINCARE", name: "Kem chăm sóc da săn mịn", price: 2190000, oldPrice: 2850000, image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=720&q=85" },
  { id: 22, brand: "SKINCARE", name: "Kem dưỡng da khô", price: 565000, oldPrice: 725000, image: "https://images.unsplash.com/photo-1611930021592-a8cfd5319ceb?auto=format&fit=crop&w=720&q=85" },
  { id: 23, brand: "SKINCARE", name: "Tinh chất dưỡng da sáng khỏe", price: 1390000, oldPrice: 1750000, image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=720&q=85" },
  { id: 24, brand: "SKINCARE", name: "Kem dưỡng cao cấp", price: 3650000, oldPrice: 4500000, image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=720&q=85", badge: "CAO CẤP" },
  { id: 25, brand: "MAKEUP", name: "Bộ trang điểm thanh lịch", price: 1090000, oldPrice: 1390000, image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=720&q=85" },
  { id: 26, brand: "MAKEUP", name: "Son môi màu hồng đất", price: 990000, oldPrice: 1290000, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=720&q=85" },
  { id: 27, brand: "MAKEUP", name: "Phấn trang điểm tự nhiên", price: 235000, oldPrice: 320000, image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=720&q=85" },
  { id: 28, brand: "HAIR & BODY", name: "Bộ chăm sóc tóc suôn mượt", price: 1490000, oldPrice: 1890000, image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=720&q=85" },
  { id: 29, brand: "HAIR & BODY", name: "Dưỡng thể dịu nhẹ", price: 720000, oldPrice: 890000, image: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=720&q=85" },
  { id: 30, brand: "SKINCARE", name: "Bộ dưỡng da mềm mịn", price: 1890000, oldPrice: 2390000, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=720&q=85", badge: "MỚI" },
];

const slugify = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const categoryNameForProduct = ({ id }: Pick<Product, "id">) =>
  [14, 25, 26, 27].includes(id) ? "Trang điểm" : [4, 16, 28, 29].includes(id) ? "Tóc & cơ thể" : "Chăm sóc da";

export const products: Product[] = baseProducts.map((product) => ({
  ...product,
  slug: slugify(product.name),
  extraImages: [],
  shortDescription: "",
  description: "",
  variant: "",
  inStock: true,
  category: categoryNameForProduct(product),
}));

export const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")}₫`;
