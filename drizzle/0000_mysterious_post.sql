CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`orders` integer DEFAULT 0 NOT NULL,
	`spent` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`customer` text NOT NULL,
	`email` text NOT NULL,
	`total` integer NOT NULL,
	`payment` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_code_unique` ON `orders` (`code`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text NOT NULL,
	`sku` text NOT NULL,
	`price` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);
--> statement-breakpoint
INSERT INTO `products` (`name`,`brand`,`sku`,`price`,`stock`,`status`,`image`,`created_at`) VALUES
('Ultimune Power Infusing Concentrate','SHISEIDO','SHI-ULT-75',2780000,18,'active','https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=300&q=80','2026-07-28'),
('Hyalu B5 Serum phục hồi chuyên sâu','LA ROCHE-POSAY','LRP-HB5-30',998000,7,'active','https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80','2026-07-28'),
('Liposome Advanced Repair Cream','DECORTÉ','DEC-LIP-50',1599000,24,'active','https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=300&q=80','2026-07-28'),
('Elixir Ultime dầu dưỡng tóc','KÉRASTASE','KER-ELI-75',1250000,5,'active','https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80','2026-07-28'),
('First Care Activating Serum VI','SULWHASOO','SUL-FCA-60',2190000,31,'active','https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=300&q=80','2026-07-28'),
('Water Sleeping Mask EX','LANEIGE','LAN-WSM-70',579000,42,'active','https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=300&q=80','2026-07-28');
--> statement-breakpoint
INSERT INTO `orders` (`code`,`customer`,`email`,`total`,`payment`,`status`,`created_at`) VALUES
('#OLA260728','Nguyễn Minh Anh','minhanh@example.com',3808000,'COD','new','28/07/2026'),
('#OLA260727','Trần Thu Hà','thuha@example.com',1599000,'Thẻ','confirmed','28/07/2026'),
('#OLA260726','Lê Khánh Linh','khanhlinh@example.com',2778000,'Chuyển khoản','shipping','27/07/2026'),
('#OLA260725','Phạm Ngọc Mai','ngocmai@example.com',1250000,'COD','completed','27/07/2026'),
('#OLA260724','Hoàng Quỳnh','quynh@example.com',2190000,'Thẻ','completed','26/07/2026'),
('#OLA260723','Vũ Thanh Thảo','thanhthao@example.com',579000,'COD','cancelled','26/07/2026');
--> statement-breakpoint
INSERT INTO `customers` (`name`,`email`,`orders`,`spent`,`created_at`) VALUES
('Nguyễn Minh Anh','minhanh@example.com',5,12480000,'12/03/2026'),
('Trần Thu Hà','thuha@example.com',3,7890000,'21/04/2026'),
('Lê Khánh Linh','khanhlinh@example.com',7,18560000,'08/01/2026'),
('Phạm Ngọc Mai','ngocmai@example.com',2,3620000,'17/06/2026'),
('Hoàng Quỳnh','quynh@example.com',4,9230000,'25/02/2026'),
('Vũ Thanh Thảo','thanhthao@example.com',1,579000,'26/07/2026');
