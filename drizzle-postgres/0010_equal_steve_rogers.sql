ALTER TABLE "products" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
UPDATE "products" SET "created_at" = NULL;
--> statement-breakpoint
UPDATE "shop_settings" SET "site_content" = jsonb_set("site_content", '{home,benefits}', '[{"title":"Hàng chính hãng","description":"Hàng nhập khẩu có thông tin nguồn gốc rõ ràng."},{"title":"Giao hàng nhanh","description":"Theo dõi đơn và nhận hàng thuận tiện."},{"title":"Đổi trả dễ dàng","description":"Hỗ trợ đổi trả theo chính sách cửa hàng."},{"title":"Tư vấn tận tâm","description":"Liên hệ cửa hàng khi bạn cần hỗ trợ lựa chọn."}]'::jsonb) WHERE "site_content" #>> '{home,benefits,0,title}' = 'Chọn lọc tinh tế';
