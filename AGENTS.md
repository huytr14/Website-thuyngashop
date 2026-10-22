# AGENTS.md — Website-thuyngashop (hướng dẫn cho Codex / coding agent)

## Dự án
Storefront mỹ phẩm **THUYNGA Shop** — Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Radix Tabs, Lucide icons. Node >= 22.
Bản hiện tại là **demo duyệt thiết kế đã gửi cho khách**: 1 trang (`app/page.tsx` → `app/storefront.tsx`), 30 sản phẩm mẫu hard-code ở `catalog/products.ts`, giỏ hàng/checkout chỉ chạy bằng React state — không backend, không lưu đơn, không thanh toán thật.

## Lệnh chuẩn
- Cài đặt: `npm ci`
- Chạy dev: `npm run dev` (http://localhost:3000)
- Kiểm tra bắt buộc sau mỗi thay đổi: `npm run build` — phải pass, kèm TypeScript không lỗi.

## Quy tắc bất biến
- **Không thay đổi giao diện đã gửi khách duyệt**: giữ bố cục, màu thương hiệu đỏ rượu vang `#800028` (biến CSS trong `app/brand.css`), font Cormorant Garamond + Montserrat, logo `public/thuynga-logo-wine.png`.
- Không hard-code khóa bí mật, mật khẩu hay connection string — tất cả qua biến môi trường (xem `.env.example`). File `.env*` đã được gitignore, trừ `.env.example`.
- Không tự mua/cấu hình domain, hosting, cổng thanh toán; không gửi email thật khi chưa được yêu cầu rõ ràng.
- Giá tiền là số nguyên VND; hiển thị bằng `formatPrice` (vi-VN, hậu tố ₫) trong `catalog/products.ts` hoặc hàm tương đương ở tầng dữ liệu mới.
- Nội dung hiển thị cho khách bằng tiếng Việt.

## Hướng triển khai bản bán thật (theo giai đoạn, làm đúng thứ tự được giao)
- **P0:** Sửa metadata (bỏ `olala-select-store.vercel.app`, dùng `NEXT_PUBLIC_SITE_URL`), tách `storefront.tsx` thành component theo section, giữ nguyên hành vi.
- **P1:** Drizzle ORM + PostgreSQL (DATABASE_URL). Schema: Category, Product, Order, OrderItem. Seed 30 sản phẩm mẫu vào DB; storefront đọc DB, fallback dữ liệu mẫu khi chưa có DATABASE_URL để build không vỡ. Trang `/admin` (mật khẩu qua `ADMIN_PASSWORD`): CRUD sản phẩm + nhập CSV đúng cột của file mẫu sản phẩm (ten_san_pham, danh_muc, thuong_hieu, gia_ban, gia_goc, link_anh_chinh, anh_phu, mo_ta_ngan, mo_ta_chi_tiet, bien_the, con_hang).
- **P2 (chỉ làm khi được giao):** giỏ hàng + checkout lưu Order thật, COD + chuyển khoản/QR, thông báo đơn mới, quản lý đơn trong admin.
- **P3 (chỉ làm khi được giao):** trang giới thiệu/liên hệ/chính sách, SEO, domain chính thức, test đầu-cuối.

## Bảo mật (bắt buộc — bản đầy đủ ở file 09_KIEN_TRUC_HOAN_THIEN_VA_BAO_MAT.md của hồ sơ dự án)
- Chống DDoS/WAF thực hiện ở Cloudflare (DNS proxy + WAF + rate limit + Turnstile) — là việc cấu hình tài khoản, không nằm trong code; code phải sẵn sàng tích hợp Turnstile cho form đăng nhập/đặt hàng/liên hệ khi được giao.
- Mọi API/form phải validate bằng Zod ở server; truy vấn chỉ qua Drizzle ORM; cookie phiên httpOnly + Secure + SameSite=Lax; có rate limit cho đăng nhập, checkout, API (Upstash khi được giao); tạo đơn và xử lý IPN thanh toán phải có idempotency + verify chữ ký và đối chiếu số tiền.
- Cấu hình security headers (CSP, nosniff, Referrer-Policy, Permissions-Policy, chống clickjacking) trong Next.js; upload ảnh giới hạn định dạng/dung lượng và đổi tên ngẫu nhiên; không log thông tin nhạy cảm (mật khẩu, khóa, dữ liệu thanh toán) ra console/log.
- Không bao giờ xử lý hay lưu dữ liệu thẻ — thanh toán qua trang của cổng thanh toán.

## Repo tham khảo (danh mục đầy đủ: file 08_REPO_THAM_KHAO_GITHUB.md ở hồ sơ dự án)
- **Đường chính:** Drizzle ORM (`drizzle-team/drizzle-orm`) cho ORM/PostgreSQL; Supabase (`supabase/supabase`) cho database + storage ảnh; shadcn/ui (`shadcn-ui/ui`) cho component admin.
- **Chỉ tham khảo pattern, không copy nguyên dự án:** `vercel/commerce` (storefront App Router/RSC/Server Actions/SEO — bỏ qua backend Shopify của nó), template ecommerce của `payloadcms/payload` (mô hình dữ liệu + admin mẫu), examples chính thức trong `vercel/next.js`, `resend/react-email` (email đơn hàng, P2), `nextauthjs/next-auth` (tài khoản khách, P2–P3), `lehuygiang28/vnpay` (VNPAY, chỉ giai đoạn cổng thanh toán, phải đối chiếu tài liệu VNPAY chính thức).
- **Cấm tự ý dùng:** Medusa, Saleor, các template Stripe/nền tảng trả phí, template cộng đồng không rõ giấy phép — trừ khi có lệnh mới rõ ràng.

## Báo cáo sau mỗi nhiệm vụ
Liệt kê: file đã thêm/sửa, thay đổi schema (nếu có), lệnh đã chạy và kết quả `npm run build`, việc còn tồn. Không tự commit/push trừ khi được yêu cầu.
