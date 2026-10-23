import { z } from "zod";

const image = z.string().max(2000).refine((value) => !value || value.startsWith("/") || /^https?:\/\//.test(value), "Ảnh không hợp lệ");
const text = z.string().trim().max(500);
const link = z.string().trim().max(2000).refine((value) => !value || value.startsWith("/") || value.startsWith("#") || /^https?:\/\//.test(value), "Liên kết không hợp lệ");
const slide = z.object({ id: z.string().uuid(), image, title: text, accent: text, description: text, buttonText: text, buttonLink: link, imageLabel: text, enabled: z.boolean() });
const section = z.object({ enabled: z.boolean(), title: text, subtitle: text });
const testimonial = z.object({ id: z.string().uuid(), name: text, content: z.string().trim().max(2000), image, rating: z.number().int().min(1).max(5), enabled: z.boolean() });

export const siteContentSchema = z.object({
  brand: z.object({ name: text.min(1), logo: image, footerLogo: image, favicon: image }),
  announcement: z.object({ enabled: z.boolean(), kicker: text, text, linkText: text, link }),
  hero: z.array(slide).max(20),
  home: z.object({ featureImage: image, categoryImages: z.array(image).length(3), journal: z.array(z.object({ image, label: text, title: text, linkText: text })).length(3), benefits: z.array(z.object({ title: text, description: text })).length(4), brandTags: z.array(text).length(5) }),
  sections: z.object({ deals: section, feature: section, categories: section, newProducts: section, priceEdit: section, brandStrip: section, journal: section, benefits: section, testimonials: section }),
  footer: z.object({ intro: z.string().trim().max(2000), address: text, hotline: text, email: z.union([z.literal(""), z.email().max(255)]), hours: text, facebook: link, instagram: link, zalo: link, tiktok: link, youtube: link, contactContent: z.string().trim().min(10).max(50000), newsletterTitle: text, newsletterIntro: text, newsletterNote: text }),
  seo: z.object({ titleTemplate: text, description: text, image }),
  testimonials: z.array(testimonial).max(30),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export const defaultSiteContent: SiteContent = {
  brand: { name: "THUYNGA Shop", logo: "/thuynga-logo-wine.png", footerLogo: "", favicon: "" },
  announcement: { enabled: true, kicker: "THUYNGA BEAUTY EDIT", text: "Vẻ đẹp được chọn lọc cho bạn", linkText: "KHÁM PHÁ NGAY", link: "#deals" },
  hero: [
    { id: "00000000-0000-4000-8000-000000000001", image: "/shiseido-eudermine-reference.png", title: "SẮC ĐỎ", accent: "VƯỢT THỜI GIAN", description: "Một điểm nhấn khó quên trong bộ sưu tập chăm sóc da được tuyển chọn.", buttonText: "KHÁM PHÁ SẢN PHẨM", buttonLink: "#deals", imageLabel: "SHISEIDO · EUDERMINE", enabled: true },
    { id: "00000000-0000-4000-8000-000000000002", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85", title: "CHẠM VÀO", accent: "VẺ ĐẸP RIÊNG", description: "Tuyển chọn mỹ phẩm cho nhịp sống hiện đại — đơn giản, tinh tế và đầy cảm hứng.", buttonText: "KHÁM PHÁ SẢN PHẨM", buttonLink: "#deals", imageLabel: "THUYNGA BEAUTY EDIT", enabled: true },
  ],
  home: {
    featureImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=85",
    categoryImages: ["https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85"],
    journal: [
      { image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=950&q=85", label: "01 / BEAUTY RITUAL", title: "Vẻ đẹp bắt đầu từ những phút dành cho mình", linkText: "KHÁM PHÁ CHĂM SÓC DA" },
      { image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=950&q=85", label: "02 / COLOR STORY", title: "Một sắc màu nhỏ, một ngày thật khác", linkText: "KHÁM PHÁ TRANG ĐIỂM" },
      { image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=950&q=85", label: "03 / SELF CARE", title: "Nhịp chăm sóc dịu dàng cho mỗi ngày", linkText: "KHÁM PHÁ SẢN PHẨM" },
    ],
    benefits: [
      { title: "Chọn lọc tinh tế", description: "Khám phá sản phẩm theo từng nhu cầu làm đẹp." },
      { title: "Tìm kiếm dễ dàng", description: "Chọn danh mục hoặc tìm tên sản phẩm thật nhanh." },
      { title: "Mua sắm thuận tiện", description: "Xem chi tiết, thêm vào túi và đặt hàng trong vài bước." },
      { title: "Thông tin rõ ràng", description: "Chính sách và kênh hỗ trợ sẽ cập nhật khi vận hành." },
    ],
    brandTags: ["DƯỠNG ẨM", "LÀM SẠCH", "TRANG ĐIỂM", "CHĂM SÓC TÓC", "CHĂM SÓC CƠ THỂ"],
  },
  sections: {
    deals: { enabled: true, title: "KHÁM PHÁ SẢN PHẨM", subtitle: "30 lựa chọn chăm sóc da, trang điểm và tóc — chọn món yêu thích, xem chi tiết và mua ngay." },
    feature: { enabled: true, title: "Mỗi ngày là một\nkhoảnh khắc đẹp.", subtitle: "Một chút chăm sóc, một chút sắc màu — để bạn luôn là phiên bản mình yêu thích." },
    categories: { enabled: true, title: "Khám phá danh mục", subtitle: "Từ bước chăm sóc da mỗi ngày đến điểm nhấn cuối cùng cho diện mạo của bạn." },
    newProducts: { enabled: true, title: "BEAUTY EDIT", subtitle: "Thêm cảm hứng cho giỏ hàng của bạn, từ dưỡng da đến chăm sóc cơ thể." },
    priceEdit: { enabled: true, title: "ĐẸP MỖI NGÀY, GIÁ DỄ CHỌN", subtitle: "Những món nhỏ xinh dưới 1 triệu đồng trong danh mục mẫu." },
    brandStrip: { enabled: true, title: "CHỌN MÓN ĐẸP THEO NHU CẦU", subtitle: "" },
    journal: { enabled: true, title: "Cảm hứng mỗi ngày", subtitle: "Những ý tưởng nhỏ để việc chăm sóc bản thân luôn là một niềm vui." },
    benefits: { enabled: true, title: "", subtitle: "" },
    testimonials: { enabled: false, title: "Cảm nhận khách hàng", subtitle: "Những chia sẻ từ khách hàng của THUYNGA Shop." },
  },
  footer: { intro: "Không gian khám phá mỹ phẩm và những lựa chọn làm đẹp dành cho bạn.", address: "", hotline: "", email: "", hours: "", facebook: "", instagram: "", zalo: "", tiktok: "", youtube: "", contactContent: "Hãy để lại lời nhắn, THUYNGA Shop sẽ phản hồi trong thời gian sớm nhất.", newsletterTitle: "THUYNGA LETTER", newsletterIntro: "Câu chuyện làm đẹp và những lựa chọn được tuyển chọn dành riêng cho bạn.", newsletterNote: "Đăng ký nhận tin sẽ mở khi website vận hành." },
  seo: { titleTemplate: "{tên trang} | THUYNGA Shop", description: "Mỹ phẩm cao cấp chính hãng, tuyển chọn dành cho người phụ nữ hiện đại.", image: "/thuynga-logo-wine.png" },
  testimonials: [],
};

export function mergeSiteContent(value: unknown): SiteContent {
  if (!value || typeof value !== "object") return defaultSiteContent;
  const item = value as Partial<SiteContent>;
  const merged = { ...defaultSiteContent, ...item, brand: { ...defaultSiteContent.brand, ...item.brand }, announcement: { ...defaultSiteContent.announcement, ...item.announcement }, home: { ...defaultSiteContent.home, ...item.home }, sections: { ...defaultSiteContent.sections, ...item.sections }, footer: { ...defaultSiteContent.footer, ...item.footer }, seo: { ...defaultSiteContent.seo, ...item.seo } };
  return siteContentSchema.safeParse(merged).data ?? defaultSiteContent;
}
