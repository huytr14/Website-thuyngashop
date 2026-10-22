# Cau truc website THUYNGA Shop

Tai lieu nay la ban thiet ke ky thuat va noi dung de dua website hien tai tu ban demo thanh cua hang my pham co the van hanh that.

## 1. Muc tieu phien ban dau

Phien ban dau can lam tron 5 viec:

1. Khach tim va xem duoc san pham theo danh muc, thuong hieu va nhu cau.
2. Khach them san pham vao gio, nhap thong tin giao hang va tao don.
3. Cua hang nhan, xac nhan, giao va hoan tat don trong trang admin.
4. Cua hang quan ly san pham, gia, ton kho va trang thai hien thi.
5. Website co du noi dung tin cay, SEO, chinh sach va thong tin lien he de cong khai ban hang.

Chua can trong phien ban dau: loyalty, affiliate, marketplace, ung dung mobile, AI tu van, nhieu kho, nhieu ngon ngu va he thong ke toan rieng.

## 2. Hien trang code

Da co:

- Trang chu storefront va giao dien responsive.
- Tim kiem san pham o phia trinh duyet.
- Gio hang va checkout dang chay bang state tam thoi.
- Trang admin tong quan, san pham, don hang, khach hang va khuyen mai.
- Cloudflare D1, Drizzle ORM va migration ban dau.
- API them/xoa san pham va cap nhat trang thai don.

Can hoan thien:

- Storefront dang dung danh sach san pham hard-code, chua doc tu D1.
- Checkout chua ghi don hang vao database.
- Chua co `order_items`, nen khong biet mot don gom san pham nao.
- Chua co slug, mo ta, danh muc, anh phu va bien the san pham.
- Admin chua duoc bao ve bang quyen truy cap.
- API admin chua co validation day du va xu ly loi cho SKU trung.
- Xoa san pham dang xoa cung, de mat lich su du lieu.
- Chua co trang chi tiet san pham, danh muc, tim kiem, tai khoan va chinh sach.
- Anh demo dang lay tu Unsplash, khong phai anh san pham that.
- Test hien tai la test cua starter cu, khong con khop website.

## 3. Sitemap

### 3.1 Khu vuc khach hang

| Duong dan | Trang | Noi dung chinh |
| --- | --- | --- |
| `/` | Trang chu | Hero, danh muc, thuong hieu, san pham moi, ban chay, uu dai, cam ket |
| `/san-pham` | Tat ca san pham | Bo loc, sap xep, phan trang |
| `/san-pham/[slug]` | Chi tiet san pham | Anh, gia, bien the, ton kho, mo ta, cach dung, thanh phan |
| `/danh-muc/[slug]` | Danh muc | Skincare, trang diem, toc va co the, nuoc hoa |
| `/thuong-hieu` | Tat ca thuong hieu | Danh sach thuong hieu A-Z |
| `/thuong-hieu/[slug]` | Thuong hieu | Gioi thieu va san pham cua thuong hieu |
| `/tim-kiem?q=` | Ket qua tim kiem | Ket qua theo ten, SKU, thuong hieu |
| `/gio-hang` | Gio hang | San pham, so luong, ma giam gia, tam tinh |
| `/thanh-toan` | Checkout | Thong tin nhan hang, van chuyen, thanh toan, xac nhan |
| `/don-hang/[code]` | Tra cuu don | Trang thai va chi tiet don, xac minh bang email/so dien thoai |
| `/cam-nang` | Cam nang | Danh sach bai viet lam dep |
| `/cam-nang/[slug]` | Bai viet | Noi dung, san pham lien quan |
| `/ve-chung-toi` | Ve cua hang | Cau chuyen, cam ket chinh hang |
| `/lien-he` | Lien he | Hotline, Zalo, Facebook, dia chi, form lien he |
| `/chinh-sach/van-chuyen` | Van chuyen | Phi, khu vuc va thoi gian giao |
| `/chinh-sach/doi-tra` | Doi tra | Dieu kien, thoi han va quy trinh |
| `/chinh-sach/bao-mat` | Bao mat | Cach thu thap va su dung du lieu |
| `/chinh-sach/thanh-toan` | Thanh toan | COD, chuyen khoan, cong thanh toan |

### 3.2 Khu vuc quan tri

| Duong dan | Chuc nang |
| --- | --- |
| `/admin` | KPI va cac viec can xu ly |
| `/admin/orders` | Loc, xem, cap nhat va ghi chu don hang |
| `/admin/orders/[id]` | Chi tiet don, san pham, dia chi, lich su trang thai |
| `/admin/products` | Danh sach, tim kiem, an/hien san pham |
| `/admin/products/new` | Tao san pham |
| `/admin/products/[id]` | Sua san pham, anh, bien the va ton kho |
| `/admin/categories` | Quan ly danh muc |
| `/admin/brands` | Quan ly thuong hieu |
| `/admin/customers` | Khach hang va lich su mua |
| `/admin/promotions` | Ma giam gia va dieu kien ap dung |
| `/admin/content` | Banner, noi dung trang chu va bai viet |
| `/admin/settings` | Thong tin cua hang, van chuyen, thanh toan |

## 4. Cau truc thu muc muc tieu

```text
app/
  (store)/
    layout.tsx
    page.tsx
    san-pham/
      page.tsx
      [slug]/page.tsx
    danh-muc/[slug]/page.tsx
    thuong-hieu/
      page.tsx
      [slug]/page.tsx
    tim-kiem/page.tsx
    gio-hang/page.tsx
    thanh-toan/page.tsx
    don-hang/[code]/page.tsx
    cam-nang/
      page.tsx
      [slug]/page.tsx
    ve-chung-toi/page.tsx
    lien-he/page.tsx
    chinh-sach/
      van-chuyen/page.tsx
      doi-tra/page.tsx
      bao-mat/page.tsx
      thanh-toan/page.tsx
  admin/
    layout.tsx
    page.tsx
    orders/
    products/
    categories/
    brands/
    customers/
    promotions/
    content/
    settings/
  api/
    checkout/route.ts
    orders/[code]/route.ts
    admin/
      orders/
      products/
      categories/
      brands/
      promotions/
  layout.tsx
  globals.css
components/
  layout/
    AnnouncementBar.tsx
    StoreHeader.tsx
    StoreFooter.tsx
    MobileNavigation.tsx
  commerce/
    ProductCard.tsx
    ProductGallery.tsx
    ProductFilters.tsx
    Price.tsx
    AddToCart.tsx
    CartDrawer.tsx
    OrderSummary.tsx
  content/
    Hero.tsx
    BrandStrip.tsx
    CategoryGrid.tsx
    EditorialCard.tsx
  admin/
    AdminSidebar.tsx
    DataTable.tsx
    StatusBadge.tsx
    ProductForm.tsx
    OrderDetail.tsx
db/
  index.ts
  schema.ts
  queries/
    products.ts
    categories.ts
    brands.ts
    orders.ts
    customers.ts
  mutations/
    products.ts
    orders.ts
    inventory.ts
lib/
  cart.ts
  checkout.ts
  currency.ts
  order-code.ts
  validation.ts
  auth.ts
  seo.ts
public/
  brand/
  banners/
  products/
  categories/
  articles/
drizzle/
tests/
  checkout.test.mjs
  order-status.test.mjs
  rendered-pages.test.mjs
```

Chi tach component khi no duoc dung lai hoac file hien tai qua kho doc. Khong tao wrapper/service chung neu chi co mot noi su dung.

## 5. Du lieu can co

Gia tien luu bang VND nguyen, khong dung so thap phan. Thoi gian luu ISO 8601 UTC va hien thi theo gio Viet Nam.

### `brands`

- `id`
- `name`
- `slug` duy nhat
- `logo`
- `description`
- `country`
- `status`: active/draft
- `sortOrder`

### `categories`

- `id`
- `name`
- `slug` duy nhat
- `description`
- `image`
- `parentId` nullable
- `status`: active/draft
- `sortOrder`

### `products`

- `id`
- `name`
- `slug` duy nhat
- `brandId`
- `categoryId`
- `sku` duy nhat
- `shortDescription`
- `description`
- `ingredients`
- `usage`
- `price`
- `compareAtPrice` nullable
- `costPrice` nullable, chi admin thay
- `stock`
- `lowStockThreshold`
- `status`: active/draft/archived
- `featured`
- `seoTitle`
- `seoDescription`
- `createdAt`, `updatedAt`

### `product_images`

- `id`
- `productId`
- `url`
- `alt`
- `sortOrder`

### `product_variants`

Chi tao khi mot san pham co dung tich, kich co, mau hoac tone khac nhau.

- `id`
- `productId`
- `name`, vi du `50 ml` hoac `Rosewood 05`
- `sku` duy nhat
- `price` nullable neu dung gia san pham cha
- `stock`
- `status`

### `customers`

- `id`
- `name`
- `email` nullable
- `phone`
- `ordersCount`
- `spent`
- `createdAt`, `updatedAt`

### `addresses`

- `id`
- `customerId` nullable
- `recipientName`
- `phone`
- `line1`
- `ward`
- `district`
- `province`
- `note` nullable

### `orders`

- `id`
- `code` duy nhat, vi du `TNG-261016-0012`
- `customerId` nullable
- Ban sao ten, email, dien thoai va dia chi tai luc dat hang
- `subtotal`, `discount`, `shippingFee`, `total`
- `paymentMethod`: cod/bank_transfer/gateway
- `paymentStatus`: pending/paid/failed/refunded
- `fulfillmentStatus`: new/confirmed/packing/shipping/completed/cancelled
- `customerNote`, `adminNote`
- `createdAt`, `updatedAt`

### `order_items`

- `id`
- `orderId`
- `productId` nullable de van giu lich su khi san pham bi archive
- `variantId` nullable
- Ban sao `sku`, `name`, `variantName`, `image`, `unitPrice`
- `quantity`
- `lineTotal`

### `promotions`

- `id`
- `code` duy nhat
- `type`: percent/fixed/free_shipping
- `value`
- `minimumOrder`
- `usageLimit` nullable
- `usedCount`
- `startsAt`, `endsAt`
- `status`

### Giai doan sau

Chi them khi cua hang thuc su can: `articles`, `reviews`, `wishlists`, `inventory_movements`, `payment_events` va `order_status_history`.

## 6. API can thiet

### Public

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `POST` | `/api/checkout` | Kiem tra gio hang, tinh lai gia, tao don va tru ton |
| `GET` | `/api/orders/[code]` | Tra cuu don sau khi xac minh thong tin khach |

Danh sach va chi tiet san pham nen doc truc tiep tu server component, khong can tao API rieng.

### Admin

| Method | Endpoint | Muc dich |
| --- | --- | --- |
| `POST` | `/api/admin/products` | Tao san pham |
| `PATCH` | `/api/admin/products/[id]` | Sua hoac archive san pham |
| `POST` | `/api/admin/products/[id]/images` | Them anh |
| `PATCH` | `/api/admin/orders/[id]` | Cap nhat trang thai va ghi chu |
| `POST/PATCH` | `/api/admin/categories` | Quan ly danh muc |
| `POST/PATCH` | `/api/admin/brands` | Quan ly thuong hieu |
| `POST/PATCH` | `/api/admin/promotions` | Quan ly khuyen mai |

Moi API ghi du lieu phai:

- Kiem tra nguoi dung admin o server.
- Validate body va ID.
- Khong tin gia/tong tien gui tu browser.
- Tra loi loi ro rang, khong de lo stack trace.
- Khong xoa cung san pham da tung nam trong don hang.

## 7. Luong mua hang

1. Server tai san pham dang `active` tu D1.
2. Khach chon bien the va so luong, gio hang luu trong `localStorage`.
3. Trang checkout gui danh sach `productId`, `variantId`, `quantity` len server.
4. Server doc lai gia, khuyen mai va ton kho tu D1.
5. Server tao `orders` va `order_items` trong mot transaction.
6. Server tru ton kho, tao ma don va tra trang xac nhan.
7. Admin nhan don moi va cap nhat: moi -> xac nhan -> dong goi -> dang giao -> hoan tat.
8. Huy don chi hoan ton khi quy trinh cua hang cho phep va don chua giao.

Khong tao don chi bang JavaScript phia trinh duyet nhu ban demo hien tai.

## 8. Thanh toan va van chuyen

### Phien ban dau

- COD.
- Chuyen khoan ngan hang bang noi dung co ma don.
- Phi giao hang co dinh hoac mien phi tu mot muc don toi thieu.
- Admin xac nhan thanh toan va cap nhat van don thu cong.

### Khi doanh so can tu dong hoa

- Ket noi mot cong thanh toan do cua hang chon.
- Ket noi don vi van chuyen co API.
- Luu callback/webhook va chong xu ly lap.

Khong nen tich hop cong thanh toan truoc khi co tai khoan doanh nghiep, hop dong va moi truong sandbox.

## 9. Quyen truy cap va bao mat

- Toan bo `/admin` va `/api/admin/*` chi cho email admin duoc phep.
- Khong dua `costPrice`, ghi chu noi bo hoac thong tin khach vao HTML public.
- Gioi han tan suat checkout va tra cuu don.
- Validate email, so dien thoai, so luong, ma giam gia va dia chi o server.
- Khong luu thong tin the; viec nay thuoc cong thanh toan.
- Ghi log thay doi quan trong: trang thai don, thanh toan, hoan tien va ton kho.
- Chinh sach bao mat phai neu ro muc dich thu thap thong tin nguoi mua.

## 10. SEO, toc do va kha nang truy cap

- Moi san pham, danh muc, thuong hieu va bai viet co title, description va URL rieng.
- Tao `sitemap.xml`, `robots.txt`, canonical URL va Product JSON-LD.
- Anh san pham dung kich thuoc that, WebP/AVIF, alt text va lazy-load ben duoi fold.
- Trang san pham va danh muc render o server de cong cu tim kiem doc duoc.
- Nut, form va menu dung duoc bang ban phim; focus ro rang.
- Mau chu/dat nen dat muc WCAG AA.
- Ton trong `prefers-reduced-motion`.
- Muc tieu Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms tren mobile tot.

## 11. Noi dung va tai san ban can chuan bi

### Bat buoc de lam storefront that

1. Ten thuong hieu chinh thuc: `THUYNGA Shop`, `HannahOlala` hay ten khac.
2. Logo goc nen trong suot, tot nhat SVG; kem logo ngang va icon vuong.
3. Bang mau thuong hieu va font neu da co quy chuan.
4. File san pham Excel/CSV, moi dong gom:
   - SKU
   - ten san pham
   - thuong hieu
   - danh muc
   - dung tich/mau/tone
   - gia ban va gia niem yet
   - ton kho
   - mo ta ngan va day du
   - thanh phan
   - cach dung
   - tinh trang ban
5. Anh san pham: toi thieu 3 anh/san pham, cung ti le, nen sach, ten file co SKU.
6. Danh sach danh muc va thuong hieu muon hien thi.
7. Anh banner desktop va mobile cho trang chu.
8. Hotline, email, Zalo, Facebook, Instagram, dia chi va gio lam viec.
9. Chinh sach van chuyen, doi tra, bao mat va thanh toan.
10. Tai khoan ngan hang neu dung chuyen khoan.
11. Quy tac phi ship va muc mien phi van chuyen.
12. Danh sach email duoc vao admin.

### Can neu tich hop dich vu

- Ten cong thanh toan va tai khoan sandbox/merchant.
- Don vi van chuyen va tai khoan API.
- Domain chinh thuc va quyen cau hinh DNS.
- Dia chi email gui don hang, vi du `orders@tenmien.vn`.
- Google Analytics/Meta Pixel ID neu can do marketing.

### Co the bo sung sau

- Cau chuyen thuong hieu va anh doi ngu.
- Bai cam nang.
- Danh gia that cua khach hang co su dong y.
- FAQ.
- Chuong trinh thanh vien va diem thuong.

## 12. Mau file san pham

```csv
sku,name,brand,category,variant,price,compare_at_price,stock,status,image_1,image_2,image_3,short_description,description,ingredients,usage
SHI-ULT-75,Ultimune Power Infusing Concentrate,Shiseido,Serum,75 ml,2780000,3850000,18,active,...
```

Khong ghep nhieu san pham vao mot o. Neu mot san pham co ba mau hoac dung tich, moi bien the dung mot dong va dung chung mot `product_group` khi import.

## 13. Thu tu trien khai

### Giai doan 1 - Nen tang ban hang

- Chot brand, sitemap, danh muc va du lieu san pham.
- Nang schema va migration.
- Chuyen storefront sang du lieu D1.
- Trang danh sach, chi tiet san pham, tim kiem va gio hang ben vung.
- Checkout COD/chuyen khoan tao don that.
- Admin xem chi tiet don va quan ly san pham.
- Bao ve admin.

### Giai doan 2 - Noi dung va van hanh

- Banner va noi dung trang chu quan ly duoc.
- Thuong hieu, danh muc, khuyen mai.
- Email xac nhan don.
- Tra cuu don.
- SEO, sitemap, structured data va analytics.
- Test cac luong mua, huy va cap nhat ton.

### Giai doan 3 - Tu dong hoa tuy nhu cau

- Cong thanh toan.
- Van chuyen va tracking tu dong.
- Tai khoan khach hang, wishlist, danh gia.
- Bao cao va loyalty.

## 14. Tieu chi hoan thanh phien ban dau

- San pham admin tao/sua duoc va xuat hien dung tren storefront.
- Gia va ton kho tren checkout luon duoc server tinh lai.
- Mot lan dat hang tao dung `order` va tat ca `order_items`.
- Khong dat duoc so luong vuot ton kho.
- Admin trai phep khong doc hay sua duoc du lieu.
- Don co the di qua toan bo luong trang thai hop le.
- Huy/xoa san pham khong lam mat lich su don cu.
- Trang chinh hoat dong tren mobile 360px va desktop.
- Cac form co label, loi ro rang va dung duoc bang ban phim.
- Build, lint va test luong checkout deu dat.

## 15. Quyet dinh can chot truoc khi code tiep

Chi can tra loi 8 muc sau:

1. Ten chinh thuc cua website.
2. Ban hang COD, chuyen khoan hay them cong thanh toan nao.
3. Phi ship va muc mien phi ship.
4. Co san pham co bien the dung tich/mau/tone khong.
5. Khach co can tao tai khoan hay cho phep mua nhanh khong tai khoan.
6. Email nao duoc vao admin.
7. Domain du kien.
8. So luong san pham ban dau va cach ban giao du lieu/anh.

Mac dinh an toan neu chua chot: mua khong can tai khoan, COD + chuyen khoan, mot kho, phi ship co dinh, san pham duoc archive thay vi xoa, admin theo allowlist email.
