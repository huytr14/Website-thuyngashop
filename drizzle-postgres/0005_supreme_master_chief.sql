ALTER TABLE "reviews" ADD COLUMN "shop_reply" text;--> statement-breakpoint
ALTER TABLE "shop_settings" ADD COLUMN "site_content" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "per_customer_limit" integer;