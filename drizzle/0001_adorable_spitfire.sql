CREATE TABLE `announcements` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`authorId` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`authorId` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`coverImage` varchar(500),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(500),
	`criteria` text,
	`points` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`uploadedBy` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`fileUrl` varchar(500) NOT NULL,
	`fileType` varchar(100),
	`fileSize` int,
	`category` varchar(100),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_rsvps` (
	`id` varchar(64) NOT NULL,
	`eventId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`status` enum('going','maybe','not_going') NOT NULL DEFAULT 'going',
	`paymentStatus` enum('pending','paid','refunded'),
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `event_rsvps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`organizerId` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`location` varchar(500),
	`coverImage` varchar(500),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`maxAttendees` int,
	`requiresPayment` boolean NOT NULL DEFAULT false,
	`price` int DEFAULT 0,
	`status` enum('draft','published','cancelled','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_categories` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`order` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `forum_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` varchar(64) NOT NULL,
	`threadId` varchar(64) NOT NULL,
	`authorId` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `forum_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_threads` (
	`id` varchar(64) NOT NULL,
	`categoryId` varchar(64) NOT NULL,
	`authorId` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`isLocked` boolean NOT NULL DEFAULT false,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `forum_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_items` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`sellerId` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`comitteePercentage` int NOT NULL DEFAULT 0,
	`images` text,
	`status` enum('pending','approved','sold','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` varchar(64),
	`approvedAt` timestamp,
	`soldAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `marketplace_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professional_profiles` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isVolunteer` boolean NOT NULL DEFAULT false,
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`website` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `professional_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `professional_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(64) NOT NULL,
	`professionalProfileId` varchar(64) NOT NULL,
	`reviewerId` varchar(64) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`logo` varchar(500),
	`primaryColor` varchar(20) DEFAULT '#0891b2',
	`subscriptionStatus` enum('trial','active','suspended','cancelled') NOT NULL DEFAULT 'trial',
	`subscriptionType` enum('monthly','annual'),
	`trialEndsAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tutorial_requests` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`requesterId` varchar(64) NOT NULL,
	`topic` varchar(500) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `tutorial_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutorials` (
	`id` varchar(64) NOT NULL,
	`tenantId` varchar(64) NOT NULL,
	`authorId` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`coverImage` varchar(500),
	`videoUrl` varchar(500),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `tutorials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`badgeId` varchar(64) NOT NULL,
	`earnedAt` timestamp DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','super_admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` varchar(500);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `announcements` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `articles` (`tenantId`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `articles` (`authorId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `badges` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `documents` (`tenantId`);--> statement-breakpoint
CREATE INDEX `event_idx` ON `event_rsvps` (`eventId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `event_rsvps` (`userId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `events` (`tenantId`);--> statement-breakpoint
CREATE INDEX `organizer_idx` ON `events` (`organizerId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `forum_categories` (`tenantId`);--> statement-breakpoint
CREATE INDEX `thread_idx` ON `forum_posts` (`threadId`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `forum_posts` (`authorId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `forum_threads` (`categoryId`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `forum_threads` (`authorId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `marketplace_items` (`tenantId`);--> statement-breakpoint
CREATE INDEX `seller_idx` ON `marketplace_items` (`sellerId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `professional_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `professional_profiles` (`category`);--> statement-breakpoint
CREATE INDEX `profile_idx` ON `reviews` (`professionalProfileId`);--> statement-breakpoint
CREATE INDEX `reviewer_idx` ON `reviews` (`reviewerId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `tutorial_requests` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `tutorials` (`tenantId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_badges` (`userId`);--> statement-breakpoint
CREATE INDEX `badge_idx` ON `user_badges` (`badgeId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `users` (`tenantId`);