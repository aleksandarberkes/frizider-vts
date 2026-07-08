-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 08, 2026 at 01:26 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fridge`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `NAME` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `NAME`) VALUES
(4, 'Desert'),
(1, 'Doručak'),
(2, 'Ručak'),
(3, 'Večera');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `recipe_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `user_id`, `recipe_id`, `content`, `is_approved`, `created_at`) VALUES
(7, 8, 4, 'FINO', 1, '2026-05-20 07:19:47'),
(8, 8, 5, 'Puno ulja', 1, '2026-05-20 13:18:57'),
(11, 8, 6, 'DOBAR', 1, '2026-05-25 19:58:24'),
(12, 9, 6, 'laksjdlaksjdklasjdlaksdjalskdjlaksjdlaksjdklasjdl', 1, '2026-05-28 11:25:24');

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `user_id` int(11) NOT NULL,
  `recipe_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`user_id`, `recipe_id`) VALUES
(3, 1),
(3, 2),
(4, 2),
(8, 4),
(8, 6),
(9, 4),
(9, 6);

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `id` int(11) NOT NULL,
  `NAME` varchar(100) NOT NULL,
  `unit` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`id`, `NAME`, `unit`) VALUES
(1, 'Jaja', 'kom'),
(2, 'Mleko', 'ml'),
(3, 'Brašno', 'g'),
(4, 'Šećer', 'g'),
(5, 'So', 'g'),
(6, 'Biber', 'g'),
(7, 'Ulje', 'ml'),
(8, 'Maslac', 'g'),
(9, 'Piletina', 'g'),
(10, 'Svinjsko meso', 'g'),
(11, 'Paradajz', 'kom'),
(12, 'Luk', 'kom'),
(13, 'Beli luk', 'čep'),
(14, 'Paprike', 'kom'),
(15, 'Sir', 'g'),
(16, 'Pavlaka', 'ml'),
(17, 'Testenina', 'g'),
(18, 'Pirinač', 'g'),
(19, 'Krompir', 'g'),
(20, 'Šunka', 'g'),
(21, 'Beli luk u granulama', 'čep'),
(22, 'Pavlaka za kuvanje', 'ml'),
(46, 'Vegeta', 'g'),
(47, 'Tucana paprika', 'g'),
(48, 'kulen', 'g'),
(49, 'origano', 'g');

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `user_id` int(11) NOT NULL,
  `recipe_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`user_id`, `recipe_id`, `rating`) VALUES
(3, 1, 5),
(4, 2, 4),
(6, 1, 4),
(8, 1, 4),
(8, 2, 1),
(8, 4, 4),
(8, 5, 3),
(8, 6, 5),
(9, 4, 4),
(9, 6, 3);

-- --------------------------------------------------------

--
-- Table structure for table `recipes`
--

CREATE TABLE `recipes` (
  `id` int(11) NOT NULL,
  `NAME` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `estimated_price` decimal(10,2) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recipes`
--

INSERT INTO `recipes` (`id`, `NAME`, `description`, `image_path`, `estimated_price`, `created_by`, `is_approved`, `created_at`) VALUES
(1, 'Kajgana sa sirom', 'Jednostavna i brza kajgana idealna za doručak.', '/images/recipes/kajgana.jpg', 250.00, 3, 1, '2026-04-26 12:54:17'),
(2, 'Piletina sa pirinčem', 'Klasičan ručak sa piletinom i kuvanim pirinčem.', '/images/recipes/piletina_pirinac.jpg', 600.00, 4, 1, '2026-04-26 12:54:17'),
(4, 'Pasta sa piletinom', 'Kremasta pasta sa piletnom iz AirFryera', '/images/recipes/pasta_piletina.jpg', 2000.00, 8, 1, '2026-05-19 13:17:47'),
(5, 'Przenice', 'Uvaljas hleb u dva jaja i isprziz', '/frizider-vts/backend/uploads/recipes/recipe_20260520_151621_4425e42cdc5e.jpg', 300.00, 8, 1, '2026-05-20 13:08:46'),
(6, 'Pizza sa kulenom', NULL, '/frizider-vts/backend/uploads/recipes/recipe_20260525_224345_1ae7dd0b0499.jpg', 1000.00, 8, 1, '2026-05-25 12:43:22');

-- --------------------------------------------------------

--
-- Table structure for table `recipe_categories`
--

CREATE TABLE `recipe_categories` (
  `recipe_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recipe_categories`
--

INSERT INTO `recipe_categories` (`recipe_id`, `category_id`) VALUES
(1, 1),
(2, 2),
(4, 2),
(5, 1),
(5, 3),
(6, 2),
(6, 3);

-- --------------------------------------------------------

--
-- Table structure for table `recipe_ingredients`
--

CREATE TABLE `recipe_ingredients` (
  `recipe_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recipe_ingredients`
--

INSERT INTO `recipe_ingredients` (`recipe_id`, `ingredient_id`, `quantity`) VALUES
(1, 1, 3.00),
(1, 5, 2.00),
(1, 7, 10.00),
(1, 15, 50.00),
(2, 5, 3.00),
(2, 9, 300.00),
(2, 12, 1.00),
(2, 18, 150.00),
(4, 6, NULL),
(4, 9, 500.00),
(4, 15, 250.00),
(4, 17, 500.00),
(4, 21, 0.00),
(4, 22, 500.00),
(4, 46, NULL),
(4, 47, NULL),
(5, 1, 2.00),
(6, 11, NULL),
(6, 15, 250.00),
(6, 48, 250.00),
(6, 49, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `NAME` enum('admin','user') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `NAME`) VALUES
(1, 'admin'),
(2, 'user');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role_id`, `is_active`, `created_at`) VALUES
(1, 'admin1@mojfrizider.rs', '$2y$10$abcdefghijklmnopqrstuv', 'Marko', 'Adminović', '0601111111', 1, 1, '2026-04-26 12:54:17'),
(2, 'admin2@mojfrizider.rs', '$2y$10$abcdefghijklmnopqrstuv', 'Jelena', 'Adminić', '0602222222', 1, 1, '2026-04-26 12:54:17'),
(3, 'pera@gmail.com', '$2y$10$abcdefghijklmnopqrstuv', 'Petar', 'Petrović', '0633333333', 2, 1, '2026-04-26 12:54:17'),
(4, 'mika@gmail.com', '$2y$10$abcdefghijklmnopqrstuv', 'Milan', 'Milić', '0644444444', 2, 1, '2026-04-26 12:54:17'),
(5, 'ana@gmail.com', '$2y$10$abcdefghijklmnopqrstuv', 'Ana', 'Anđelić', '0655555555', 2, 1, '2026-04-26 12:54:17'),
(6, 'iva@gmail.com', '$2y$10$abcdefghijklmnopqrstuv', 'Ivana', 'Ivić', '0666666666', 2, 1, '2026-04-26 12:54:17'),
(8, 'lukaplivac1@gmail.com', '$2y$10$5RpWzdUMqM0F/7W8ebkXCuGxPHNwTxmtCSfqQhkVTwUPhu5S0CYOm', 'Pera', 'Zdera', NULL, 2, 1, '2026-05-10 21:03:48'),
(9, 'lukadulac4@gmail.com', '$2y$10$qa8jSsY8nksXG/xOa7wWEeGUCE2jg2KVpZpJgCilgwIhL3BvRckFa', 'Luka', 'Dulac', '0645406999', 1, 1, '2026-05-15 07:14:15');

-- --------------------------------------------------------

--
-- Table structure for table `user_fridge`
--

CREATE TABLE `user_fridge` (
  `user_id` int(11) NOT NULL,
  `ingredient_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_fridge`
--

INSERT INTO `user_fridge` (`user_id`, `ingredient_id`) VALUES
(3, 1),
(3, 5),
(3, 7),
(3, 15),
(4, 9),
(4, 12),
(4, 18),
(5, 16),
(5, 17),
(5, 20);

-- --------------------------------------------------------

--
-- Table structure for table `user_tokens`
--

CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `TYPE` enum('activation','password_reset') NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `weekly_menus`
--

CREATE TABLE `weekly_menus` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `weekly_menu_recipes`
--

CREATE TABLE `weekly_menu_recipes` (
  `id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL,
  `recipe_id` int(11) NOT NULL,
  `position` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `NAME` (`NAME`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `recipe_id` (`recipe_id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`user_id`,`recipe_id`),
  ADD KEY `recipe_id` (`recipe_id`);

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `NAME` (`NAME`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`user_id`,`recipe_id`),
  ADD KEY `recipe_id` (`recipe_id`);

--
-- Indexes for table `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `recipe_categories`
--
ALTER TABLE `recipe_categories`
  ADD PRIMARY KEY (`recipe_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `recipe_ingredients`
--
ALTER TABLE `recipe_ingredients`
  ADD PRIMARY KEY (`recipe_id`,`ingredient_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `NAME` (`NAME`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `user_fridge`
--
ALTER TABLE `user_fridge`
  ADD PRIMARY KEY (`user_id`,`ingredient_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indexes for table `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `weekly_menus`
--
ALTER TABLE `weekly_menus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_weekly_menus_user` (`user_id`);

--
-- Indexes for table `weekly_menu_recipes`
--
ALTER TABLE `weekly_menu_recipes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_weekly_menu_day_recipe` (`menu_id`,`day_of_week`,`recipe_id`),
  ADD KEY `idx_weekly_menu_recipes_menu_day` (`menu_id`,`day_of_week`),
  ADD KEY `idx_weekly_menu_recipes_recipe` (`recipe_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `recipes`
--
ALTER TABLE `recipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user_tokens`
--
ALTER TABLE `user_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `weekly_menus`
--
ALTER TABLE `weekly_menus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `weekly_menu_recipes`
--
ALTER TABLE `weekly_menu_recipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`);

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`);

--
-- Constraints for table `recipes`
--
ALTER TABLE `recipes`
  ADD CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `recipe_categories`
--
ALTER TABLE `recipe_categories`
  ADD CONSTRAINT `recipe_categories_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recipe_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `recipe_ingredients`
--
ALTER TABLE `recipe_ingredients`
  ADD CONSTRAINT `recipe_ingredients_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recipe_ingredients_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `user_fridge`
--
ALTER TABLE `user_fridge`
  ADD CONSTRAINT `user_fridge_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_fridge_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`);

--
-- Constraints for table `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD CONSTRAINT `user_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `weekly_menus`
--
ALTER TABLE `weekly_menus`
  ADD CONSTRAINT `fk_weekly_menus_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `weekly_menu_recipes`
--
ALTER TABLE `weekly_menu_recipes`
  ADD CONSTRAINT `fk_weekly_menu_recipes_menu` FOREIGN KEY (`menu_id`) REFERENCES `weekly_menus` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_weekly_menu_recipes_recipe` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
