CREATE DATABASE IF NOT EXISTS recipe
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE recipe;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('admin', 'user') NOT NULL UNIQUE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(255),
    estimated_price DECIMAL(10,2),
    created_by INT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE recipe_ingredients (
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity DECIMAL(10,2),
    PRIMARY KEY (recipe_id, ingredient_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE recipe_categories (
    recipe_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (recipe_id, category_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE user_fridge (
    user_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    PRIMARY KEY (user_id, ingredient_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE favorites (
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE ratings (
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('activation', 'password_reset') NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



INSERT INTO roles (id, name) VALUES
(1, 'admin'),
(2, 'user');

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, is_active) VALUES
(1, 'admin1@mojfrizider.rs', '$2y$10$abcdefghijklmnopqrstuv', 'Marko', 'Adminović', '0601111111', 1, 1),
(2, 'admin2@mojfrizider.rs', '$2y$10$abcdefghijklmnopqrstuv', 'Jelena', 'Adminić', '0602222222', 1, 1),

(3, 'pera@gmail.com', '$2y$10$abcdefghijklmnopqrstuv', 'Petar', 'Petrović', '0633333333', 2, 1),
(4, 'mika@gmail.com', '$2y$10$abcdefghijklmnopqrstuv', 'Milan', 'Milić', '0644444444', 2, 1),
(5, 'ana@gmail.com',  '$2y$10$abcdefghijklmnopqrstuv', 'Ana', 'Anđelić', '0655555555', 2, 1),
(6, 'iva@gmail.com',  '$2y$10$abcdefghijklmnopqrstuv', 'Ivana', 'Ivić', '0666666666', 2, 1),
(7, 'luka@gmail.com', '$2y$10$abcdefghijklmnopqrstuv', 'Luka', 'Lukić', '0677777777', 2, 1);

INSERT INTO ingredients (id, name, unit) VALUES
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
(20, 'Šunka', 'g');

INSERT INTO categories (id, name) VALUES
(1, 'Doručak'),
(2, 'Ručak'),
(3, 'Večera'),
(4, 'Desert');

INSERT INTO recipes (id, name, description, image_path, estimated_price, created_by, is_approved) VALUES
(1, 'Kajgana sa sirom',
 'Jednostavna i brza kajgana idealna za doručak.',
 'kajgana.jpg', 250.00, 3, 1),

(2, 'Piletina sa pirinčem',
 'Klasičan ručak sa piletinom i kuvanim pirinčem.',
 'piletina_pirinac.jpg', 600.00, 4, 1),

(3, 'Testenina sa pavlakom i šunkom',
 'Kremasta testenina spremna za 20 minuta.',
 'testenina.jpg', 450.00, 5, 1);

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
(1, 1, 3),
(1, 15, 50),
(1, 7, 10),
(1, 5, 2),
(2, 9, 300),
(2, 18, 150),
(2, 12, 1),
(2, 5, 3),
(3, 17, 200),
(3, 16, 100),
(3, 20, 80),
(3, 5, 2);

INSERT INTO recipe_categories (recipe_id, category_id) VALUES
(1, 1),
(2, 2),
(3, 3);

INSERT INTO user_fridge (user_id, ingredient_id) VALUES
(3, 1),
(3, 15),
(3, 7),
(3, 5),
(4, 9),
(4, 18),
(4, 12),
(5, 17),
(5, 16),
(5, 20);

INSERT INTO favorites (user_id, recipe_id) VALUES
(3, 1),
(3, 2),
(4, 2),
(5, 3);

INSERT INTO ratings (user_id, recipe_id, rating) VALUES
(3, 1, 5),
(4, 2, 4),
(5, 3, 5),
(6, 1, 4);

INSERT INTO comments (user_id, recipe_id, content, is_approved) VALUES
(3, 1, 'Odličan recept, pravim ga stalno!', 1),
(4, 2, 'Jednostavno i ukusno, preporuka.', 1),
(5, 3, 'Brzo gotovo i baš zasitno.', 1);