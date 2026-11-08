-- School project. All brands, products and images are fictional example data.
CREATE DATABASE IF NOT EXISTS bagstage;
USE bagstage;

CREATE TABLE brands (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE products (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    brand_id INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    price INT NOT NULL,
    item_condition VARCHAR(50),
    description TEXT,
    image VARCHAR(255),
    color VARCHAR(50),

    PRIMARY KEY (id),

    CONSTRAINT fk_product_brand
    FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB;

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE favorites (
    user_id INT,
    product_id INT,

    PRIMARY KEY (user_id, product_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;


INSERT INTO brands (name) VALUES
('Nordic Atelier'),
('Maison Lumen'),
('Studio Fjord'),
('Atelier Aurora'),
('Haven & Co');


INSERT INTO products
    (name, brand_id, category, price, item_condition, description, image, color)
VALUES
    ('Vintage Lumen Classic Bag',
     (SELECT id FROM brands WHERE name = 'Maison Lumen'),
     'handbag', 2450, 'Very good',
     'A vintage handbag in very good condition.',
     'images/bag-01.png', 'Black'),

    ('Nordic Canvas Weekend Bag',
     (SELECT id FROM brands WHERE name = 'Nordic Atelier'),
     'weekend bag', 1250, 'Good',
     'A classic canvas weekend bag with a spacious interior.',
     'images/bag-02.png', 'Brown'),

    ('Aurora Mini Evening Clutch',
     (SELECT id FROM brands WHERE name = 'Atelier Aurora'),
     'clutches', 950, 'Excellent',
     'A compact clutch suitable for evening occasions.',
     'images/bag-03.png', 'Brown'),

    ('Haven Leather Shopper',
     (SELECT id FROM brands WHERE name = 'Haven & Co'),
     'shopper', 3200, 'Very good',
     'A spacious leather shopper with a timeless design.',
     'images/bag-04.png', 'Orange'),

    ('Fjord City Backpack',
     (SELECT id FROM brands WHERE name = 'Studio Fjord'),
     'backpack', 1650, 'Good',
     'A practical backpack suitable for everyday use.',
     'images/bag-05.png', 'Brown'),

    ('Lumen Quilted Mini Clutch',
     (SELECT id FROM brands WHERE name = 'Maison Lumen'),
     'clutches', 1850, 'Excellent',
     'A small quilted clutch with an elegant design.',
     'images/bag-06.png', 'White'),

    ('Nordic Vintage Shoulder Bag',
     (SELECT id FROM brands WHERE name = 'Nordic Atelier'),
     'handbag', 1100, 'Good',
     'A vintage shoulder bag with a classic silhouette.',
     'images/bag-07.png', 'Brown'),

    ('Aurora Travel Weekend Bag',
     (SELECT id FROM brands WHERE name = 'Atelier Aurora'),
     'weekend bag', 1750, 'Very good',
     'A spacious weekend bag designed for short trips.',
     'images/bag-08.png', 'Beige'),

    ('Haven Classic Day Shopper',
     (SELECT id FROM brands WHERE name = 'Haven & Co'),
     'shopper', 2800, 'Very good',
     'A classic shopper with a spacious everyday design.',
     'images/bag-09.png', 'Black'),

    ('Fjord Signature Print Backpack',
     (SELECT id FROM brands WHERE name = 'Studio Fjord'),
     'backpack', 1900, 'Excellent',
     'A printed backpack in excellent condition.',
     'images/bag-10.png', 'Brown');


SELECT products.name AS product,
brands.name AS brand,
products.category,
products.price
FROM products
JOIN brands ON products.brand_id = brands.id;



-- To make a user an admin, register an account in the app first, then run:
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';