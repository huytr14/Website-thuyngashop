import type { ShopCategory } from "../lib/categories.ts";

const groups = [
  ["Thực phẩm chức năng", "Xương khớp", "Tim mạch & Tuần hoàn", "Não bộ & Trí nhớ", "Mắt", "Vitamin & Khoáng chất", "Mẹ bầu & Sau sinh", "Cho bé", "Chiều cao", "Ngủ ngon & Thư giãn", "Gan & Thải độc", "Đẹp từ bên trong", "Sức khỏe nam giới", "Sức khỏe nữ giới"],
  ["Thực phẩm & Đồ uống", "Bánh kẹo & Socola", "Đồ uống & Bột pha", "Gia vị & Nước sốt", "Đồ hộp & Ăn liền", "Hạt & Trái cây sấy", "Sữa & Dinh dưỡng"],
  ["Trái cây nhập khẩu", "Nho", "Táo & Lê", "Cam & Quýt", "Trái cây khác & theo mùa"],
  ["Mỹ phẩm & Chăm sóc", "Chăm sóc da", "Trang điểm", "Nước hoa", "Chăm sóc cơ thể", "Chăm sóc tóc", "Vệ sinh cá nhân"],
  ["Mẹ & Bé", "Sữa & Dinh dưỡng cho bé", "Tã & Đồ dùng cho bé"],
] as const;

const slugify = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sampleImages = [
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85",
];

export const categories: ShopCategory[] = groups.flatMap((group, groupIndex) => {
  const rootId = groups.slice(0, groupIndex).reduce((sum, item) => sum + item.length, 0) + 1;
  return group.map((name, index) => ({ id: rootId + index, name, slug: slugify(name), description: "", parentId: index ? rootId : null, image: "", sortOrder: index || groupIndex, isVisible: true, requiresDisclaimer: groupIndex === 0 && index === 0 }));
});

export type Product = {
  id: number; name: string; slug: string; brand: string; price: number; oldPrice: number;
  image: string; extraImages: string[]; shortDescription: string; description: string;
  variant: string; inStock: boolean; badge?: string; category: string; categoryId?: number | null;
  origin?: string | null; specification?: string; expiryDate?: string | null;
  seoTitle?: string; seoDescription?: string;
  variantOptions?: { name: string; values: string[] }[];
  variantRows?: { name: string; price: number; quantity: number; image?: string }[];
  trackInventory?: boolean;
  flashPrice?: number | null; flashStock?: number | null; soldCount?: number;
  createdAt?: Date;
};

// Catalog và ảnh đều là minh họa; đối chiếu nhãn, giá, nguồn gốc và HSD trước khi đăng bán.
const samples: [string, string, string, number, string, string, string][] = [
  ["Kirkland Fish Oil 1000 mg", "Kirkland", "Tim mạch & Tuần hoàn", 490000, "Mỹ", "Lọ 400 viên", "2027-12-31"],
  ["Kirkland Glucosamine HCl", "Kirkland", "Xương khớp", 650000, "Mỹ", "Lọ 375 viên", "2027-10-31"],
  ["Nature Made Prenatal Multi + DHA", "Nature Made", "Mẹ bầu & Sau sinh", 590000, "Mỹ", "Lọ 110 viên", "2027-08-31"],
  ["Nature Made Vitamin D3", "Nature Made", "Vitamin & Khoáng chất", 320000, "Mỹ", "Lọ 180 viên", "2027-09-30"],
  ["Blackmores Omega Triple", "Blackmores", "Tim mạch & Tuần hoàn", 790000, "Úc", "Lọ 150 viên", "2027-11-30"],
  ["Centrum Adults Multivitamin", "Centrum", "Vitamin & Khoáng chất", 550000, "Mỹ", "Lọ 200 viên", "2027-06-30"],
  ["Healthy Care Collagen", "Healthy Care", "Đẹp từ bên trong", 620000, "Úc", "Lọ 120 viên", "2027-10-31"],
  ["Nature's Bounty Lutein", "Nature's Bounty", "Mắt", 380000, "Mỹ", "Lọ 60 viên", "2027-07-31"],
  ["Welch's Fruit Snacks", "Welch's", "Bánh kẹo & Socola", 230000, "Mỹ", "Hộp 40 gói", "2027-05-31"],
  ["Hershey's Kisses Milk Chocolate", "Hershey's", "Bánh kẹo & Socola", 195000, "Mỹ", "Túi 283 g", "2027-04-30"],
  ["Kewpie Sốt mè rang", "Kewpie", "Gia vị & Nước sốt", 125000, "Nhật Bản", "Chai 380 ml", "2027-06-30"],
  ["Knorr Bột nêm gà", "Knorr", "Gia vị & Nước sốt", 115000, "Mỹ", "Hộp 1 kg", "2027-08-31"],
  ["Tang Bột cam", "Tang", "Đồ uống & Bột pha", 175000, "Mỹ", "Hộp 90 gói", "2027-03-31"],
  ["Planters Hạt tổng hợp", "Planters", "Hạt & Trái cây sấy", 280000, "Mỹ", "Hũ 292 g", "2027-06-30"],
  ["Spam Classic", "Spam", "Đồ hộp & Ăn liền", 140000, "Mỹ", "Hộp 340 g", "2028-01-31"],
  ["Nho Shine Muscat", "Shine Muscat", "Nho", 590000, "Hàn Quốc", "Hộp 1 kg", "2026-11-15"],
  ["Táo Envy", "Envy", "Táo & Lê", 190000, "Mỹ", "Túi 1 kg", "2026-11-15"],
  ["Cam Navel", "Navel", "Cam & Quýt", 170000, "Mỹ", "Túi 1 kg", "2026-11-15"],
  ["Lê Hàn Quốc", "Korean Pear", "Táo & Lê", 220000, "Hàn Quốc", "Hộp 1 kg", "2026-11-15"],
  ["Armani Sì Passione", "Giorgio Armani", "Nước hoa", 2800000, "Pháp", "Chai 50 ml", "2028-06-30"],
  ["Bath & Body Works Sữa tắm", "Bath & Body Works", "Chăm sóc cơ thể", 390000, "Mỹ", "Chai 295 ml", "2028-03-31"],
  ["su:m37 Sun Stick", "su:m37", "Chăm sóc da", 690000, "Hàn Quốc", "Thỏi 18 g", "2028-05-31"],
  ["Shiseido Eudermine Essence", "Shiseido", "Chăm sóc da", 2780000, "Nhật Bản", "Chai 145 ml", "2028-05-31"],
  ["Maybelline SuperStay Matte Ink", "Maybelline", "Trang điểm", 290000, "Mỹ", "Thỏi 5 ml", "2028-04-30"],
  ["Meiji Sữa thanh số 0", "Meiji", "Sữa & Dinh dưỡng cho bé", 520000, "Nhật Bản", "Hộp 24 thanh", "2027-06-30"],
  ["Merries Tã dán size M", "Merries", "Tã & Đồ dùng cho bé", 420000, "Nhật Bản", "Gói 64 miếng", "2028-01-31"],
];

export const products: Product[] = samples.map(([name, brand, category, price, origin, specification, expiryDate], index) => ({
  id: index + 1, name, slug: slugify(name), brand, category, price, oldPrice: price,
  image: sampleImages[index % sampleImages.length], extraImages: [], shortDescription: "Dữ liệu sản phẩm mẫu để duyệt giao diện; vui lòng đối chiếu thông tin trên nhãn trước khi đăng bán.",
  description: "", variant: "", inStock: true, origin, specification, expiryDate,
  categoryId: categories.find((item) => item.name === category)?.id,
}));

for (const product of products.slice(0, 6)) product.extraImages = [1, 2, 3].map((offset) => sampleImages[(product.id - 1 + offset) % sampleImages.length]);
const sampleVariants: Record<string, { name: string; values: string[]; prices: number[]; image?: string }> = {
  "Kirkland Fish Oil 1000 mg": { name: "Quy cách", values: ["100 viên", "200 viên"], prices: [290000, 490000], image: sampleImages[1] },
  "Bath & Body Works Sữa tắm": { name: "Mùi hương", values: ["Hoa hồng", "Vani"], prices: [390000, 420000] },
  "Shiseido Eudermine Essence": { name: "Dung tích", values: ["145ml", "200ml"], prices: [2780000, 3280000] },
};
for (const product of products) { const sample = sampleVariants[product.name]; if (sample) { product.variantOptions = [{ name: sample.name, values: sample.values }]; product.variantRows = sample.values.map((name, index) => ({ name, price: sample.prices[index], quantity: 10, ...(index === 1 && sample.image ? { image: sample.image } : {}) })); } }

export const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")}₫`;
