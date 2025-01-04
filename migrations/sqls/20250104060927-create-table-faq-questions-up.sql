CREATE TABLE IF NOT EXISTS `faq_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` varchar(255) DEFAULT NULL,
  `faq_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_faq_id` (`faq_id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_faq_questions_faq_id` FOREIGN KEY (`faq_id`) REFERENCES `faqs`(`id`) ON UPDATE SET NULL ON DELETE SET NULL,
  CONSTRAINT `fk_faq_questions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE SET NULL ON DELETE SET NULL,
  CONSTRAINT `fk_faq_questions_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE SET NULL ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;