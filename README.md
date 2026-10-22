# Website thuyngashop

Mã nguồn giao diện cửa hàng mỹ phẩm THUYNGA Shop, xây bằng Next.js App Router và React. Đây là bản xem trước để duyệt thiết kế: 30 sản phẩm đang dùng dữ liệu mẫu; thao tác đặt hàng không lưu đơn và không thu tiền thật.

## Chạy tại máy

Yêu cầu Node.js 22 trở lên.

```bash
npm ci
npm run dev
```

Mở `http://localhost:3000`. Kiểm tra bản production bằng `npm run build`.

## Cấu trúc

```text
app/                 Trang chủ, layout và CSS của storefront
components/ui/       Component giao diện dùng chung
catalog/products.ts  Dữ liệu sản phẩm mẫu và hàm định dạng liên quan
public/              Logo, ảnh thương hiệu và ảnh minh họa cần để hiển thị
```

Chưa có backend đặt hàng, tài khoản khách, quản trị, nhập Excel hay cổng thanh toán trong repo này. Cần triển khai và kiểm thử các phần đó trước khi dùng để bán hàng thật. Không nhập thông tin cá nhân thật vào form demo.
