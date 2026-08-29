-- Run this once as your MySQL administrator (for example, in MySQL Workbench).
CREATE DATABASE IF NOT EXISTS outbox CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'reachinbox'@'localhost' IDENTIFIED BY 'reachinbox';
GRANT ALL PRIVILEGES ON outbox.* TO 'reachinbox'@'localhost';
FLUSH PRIVILEGES;
