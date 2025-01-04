INSERT INTO `users`(`username`, `password`, `fullname`, `is_active`, `created_at`, `created_by`)
VALUES ('dion', '$2b$10$3EGJaP4g6.dHlkto1teppef6svxstq1Z0QX5SQhrR9IjnBcJX63P.', NULL, 1, NOW() , 1)
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `fullname` = VALUES(`fullname`),
  `is_active` = VALUES(`is_active`),
  `created_at` = VALUES(`created_at`),
  `created_by` = VALUES(`created_by`);