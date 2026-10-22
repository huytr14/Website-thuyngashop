CREATE TABLE "shop_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"free_shipping_threshold" integer DEFAULT 1000000 NOT NULL,
	"standard_shipping_fee" integer DEFAULT 30000 NOT NULL,
	"bank_name" varchar(150) DEFAULT '' NOT NULL,
	"bank_account_name" varchar(150) DEFAULT '' NOT NULL,
	"bank_account_number" varchar(50) DEFAULT '' NOT NULL,
	"viet_qr_url" text DEFAULT '' NOT NULL,
	"shop_email" varchar(255) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"min_order" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'MOI';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "idempotency_key" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "city" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "district" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_fee" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "voucher_code" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key");