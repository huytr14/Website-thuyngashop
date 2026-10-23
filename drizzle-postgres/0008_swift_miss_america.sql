CREATE TABLE "wishlist_items" (
	"user_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_items_user_id_product_id_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_name" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "flash_price" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "flash_stock" integer;--> statement-breakpoint
ALTER TABLE "shop_settings" ADD COLUMN "flash_sale_title" text DEFAULT 'Flash Sale' NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_settings" ADD COLUMN "flash_sale_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shop_settings" ADD COLUMN "flash_sale_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;