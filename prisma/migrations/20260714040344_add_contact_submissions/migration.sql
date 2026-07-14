-- CreateTable
CREATE TABLE `contact_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `subject` VARCHAR(160) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('NEW', 'READ', 'REPLIED', 'ARCHIVED') NOT NULL DEFAULT 'NEW',
    `respondedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `contact_submissions_status_idx`(`status`),
    INDEX `contact_submissions_createdAt_idx`(`createdAt`),
    INDEX `contact_submissions_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
