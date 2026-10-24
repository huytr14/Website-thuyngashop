import { z } from "zod";

const image = z.string().max(2000).refine((value) => !value || value.startsWith("/") || /^https?:\/\//.test(value), "Ảnh không hợp lệ");
const text = z.string().trim().max(500);
const link = z.string().trim().max(2000).refine((value) => !value || value.startsWith("/") || value.startsWith("#") || /^https?:\/\//.test(value), "Liên kết không hợp lệ");
const slide = z.object({ id: z.string().uuid(), image, title: text, accent: text, description: text, buttonText: text, buttonLink: link, imageLabel: text, enabled: z.boolean() });
const section = z.object({ enabled: z.boolean(), title: text, subtitle: text });
const testimonial = z.object({ id: z.string().uuid(), name: text, content: z.string().trim().max(2000), image, rating: z.number().int().min(1).max(5), enabled: z.boolean() });

export const siteContentSchema = z.object({
  brand: z.object({ name: text.min(1), logo: image, footerLogo: image, favicon: image }),
  announcement: z.object({ enabled: z.boolean(), kicker: text, text, promo: text, linkText: text, link }),
  hero: z.array(slide).max(20),
  departmentRails: z.array(z.object({ categorySlug: z.string().trim().max(100), title: text, enabled: z.boolean() })).max(4),
  home: z.object({ featureImage: image, categoryImages: z.array(image).length(3), journal: z.array(z.object({ image, label: text, title: text, linkText: text })).length(3), benefits: z.array(z.object({ title: text, description: text })).length(4), brandTags: z.array(text).length(5) }),
  sections: z.object({ deals: section, feature: section, categories: section, brandStrip: section, journal: section, benefits: section, testimonials: section }),
  footer: z.object({ intro: z.string().trim().max(2000), address: text, hotline: text, email: z.union([z.literal(""), z.email().max(255)]), hours: text, facebook: link, instagram: link, zalo: link, messenger: link, tiktok: link, youtube: link, contactContent: z.string().trim().min(10).max(50000), newsletterTitle: text, newsletterIntro: text, newsletterNote: text }),
  seo: z.object({ titleTemplate: text, description: text, image }),
  testimonials: z.array(testimonial).max(30),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export const defaultSiteContent: SiteContent = {
  brand: { name: "THUYNGA Shop", logo: "/thuynga-logo-wine.png", footerLogo: "", favicon: "" },
  announcement: { enabled: true, kicker: "HÀNG NHẬP KHẨU CHÍNH HÃNG", text: "Thực phẩm chức năng, thực phẩm, trái cây & mỹ phẩm từ Mỹ · Nhật · Hàn · Úc", promo: "", linkText: "KHÁM PHÁ NGAY", link: "#deals" },
  hero: [
    { id: "00000000-0000-4000-8000-000000000001", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&q=85", title: "HÀNG MỸ", accent: "CHỌN LỌC", description: "Thực phẩm chức năng và hàng nhập khẩu chính hãng cho nhu cầu mỗi ngày. Ảnh minh họa.", buttonText: "KHÁM PHÁ SẢN PHẨM", buttonLink: "/danh-muc/thuc-pham-chuc-nang", imageLabel: "THỰC PHẨM CHỨC NĂNG · ẢNH MẪU", enabled: true },
    { id: "00000000-0000-4000-8000-000000000002", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=85", title: "HƯƠNG VỊ", accent: "BỐN PHƯƠNG", description: "Khám phá trái cây và thực phẩm nhập khẩu từ Mỹ, Nhật, Hàn, Úc. Ảnh minh họa.", buttonText: "KHÁM PHÁ SẢN PHẨM", buttonLink: "/danh-muc/thuc-pham-do-uong", imageLabel: "THỰC PHẨM & TRÁI CÂY · ẢNH MẪU", enabled: true },
  ],
  departmentRails: [{ categorySlug: "thuc-pham-chuc-nang", title: "Thực phẩm chức năng", enabled: true }, { categorySlug: "thuc-pham-do-uong", title: "Thực phẩm & Đồ uống", enabled: true }],
  home: {
    featureImage: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1400&q=85",
    categoryImages: ["https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85"],
    journal: [
      { image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=950&q=85", label: "01 / HÀNG MỸ", title: "Lựa chọn chăm sóc sức khỏe mỗi ngày", linkText: "KHÁM PHÁ TPCN" },
      { image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=950&q=85", label: "02 / ẨM THỰC", title: "Hương vị nhập khẩu cho cả gia đình", linkText: "KHÁM PHÁ THỰC PHẨM" },
      { image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=950&q=85", label: "03 / CHĂM SÓC", title: "Mỹ phẩm và chăm sóc cá nhân chính hãng", linkText: "KHÁM PHÁ SẢN PHẨM" },
    ],
    benefits: [
      { title: "Hàng chính hãng", description: "Hàng nhập khẩu có thông tin nguồn gốc rõ ràng." },
      { title: "Giao hàng nhanh", description: "Theo dõi đơn và nhận hàng thuận tiện." },
      { title: "Đổi trả dễ dàng", description: "Hỗ trợ đổi trả theo chính sách cửa hàng." },
      { title: "Tư vấn tận tâm", description: "Liên hệ cửa hàng khi bạn cần hỗ trợ lựa chọn." },
    ],
    brandTags: ["XƯƠNG KHỚP", "DẦU CÁ OMEGA", "VITAMIN", "TRÁI CÂY MỸ", "NƯỚC HOA"],
  },
  sections: {
    deals: { enabled: true, title: "KHÁM PHÁ SẢN PHẨM", subtitle: "Hàng nhập khẩu đa ngành từ Mỹ, Nhật, Hàn, Úc — thông tin mẫu cần đối chiếu trước khi bán." },
    feature: { enabled: true, title: "Hàng nhập khẩu\nchọn lọc cho bạn.", subtitle: "Từ thực phẩm, trái cây đến chăm sóc cá nhân — mua sắm rõ nguồn gốc, dễ chọn lựa." },
    categories: { enabled: true, title: "Khám phá danh mục", subtitle: "Tìm theo ngành hàng nhập khẩu phù hợp với nhu cầu của bạn." },
    brandStrip: { enabled: true, title: "THƯƠNG HIỆU ĐANG BÁN", subtitle: "" },
    journal: { enabled: true, title: "Khám phá mỗi ngày", subtitle: "Gợi ý mua sắm theo ngành hàng nhập khẩu." },
    benefits: { enabled: true, title: "", subtitle: "" },
    testimonials: { enabled: false, title: "Cảm nhận khách hàng", subtitle: "Những chia sẻ từ khách hàng của THUYNGA Shop." },
  },
  footer: { intro: "Hàng nhập khẩu chính hãng: thực phẩm chức năng, thực phẩm, trái cây, mỹ phẩm và chăm sóc cá nhân.", address: "", hotline: "", email: "", hours: "", facebook: "", instagram: "", zalo: "", messenger: "", tiktok: "", youtube: "", contactContent: "Hãy để lại lời nhắn, THUYNGA Shop sẽ phản hồi trong thời gian sớm nhất.", newsletterTitle: "THUYNGA LETTER", newsletterIntro: "Cập nhật hàng nhập khẩu mới và gợi ý mua sắm dành cho bạn.", newsletterNote: "Đăng ký nhận tin sẽ mở khi website vận hành." },
  seo: { titleTemplate: "{tên trang} | THUYNGA Shop", description: "THUYNGA Shop — hàng nhập khẩu chính hãng: thực phẩm chức năng, thực phẩm, trái cây và mỹ phẩm từ Mỹ, Nhật, Hàn, Úc.", image: "/thuynga-logo-wine.png" },
  testimonials: [],
};

export function mergeSiteContent(value: unknown): SiteContent {
  if (!value || typeof value !== "object") return defaultSiteContent;
  const item = value as Partial<SiteContent>;
  const merged = { ...defaultSiteContent, ...item, brand: { ...defaultSiteContent.brand, ...item.brand }, announcement: { ...defaultSiteContent.announcement, ...item.announcement }, home: { ...defaultSiteContent.home, ...item.home }, sections: { ...defaultSiteContent.sections, ...item.sections }, footer: { ...defaultSiteContent.footer, ...item.footer }, seo: { ...defaultSiteContent.seo, ...item.seo } };
  return siteContentSchema.safeParse(merged).data ?? defaultSiteContent;
}
