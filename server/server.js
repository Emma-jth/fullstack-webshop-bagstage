const express = require('express'); 
const mysql = require("mysql2"); 
const cors = require("cors");
const bcrypt = require("bcrypt"); 
const crypto = require("crypto"); 
const cookieParser = require("cookie-parser"); 
require('dotenv').config();


const app = express(); 

app.use(express.json());  
app.use(cookieParser()); 

app.use(cors({  
    origin: true,
    credentials: true
}));

const sessions = new Map();


function getLoggedInUser(req) {

    const sessionId = req.cookies.sessionId; // Get the session ID from the cookies 
    const user = sessions.get(sessionId); 

    if (user) {
        return user;
    }

    return null;
}
function requireAdmin(req, res, next) {
    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({ message: "Please login" });
    }

    if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    next();
}


const db = mysql.createConnection({
  host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((error) => {
    if (error) {
        console.error("Database connection failed:", error);
        return;
    }
    console.log("Connected to MaraDB");
}); 




app.get("/api/products", (req, res) => {
    const sql = `
        SELECT
            products.id,
            products.name,
            brands.name AS brand,
            products.category,
            products.price,
            products.item_condition,
            products.description,
            products.image,
            products.color
        FROM products
        JOIN brands ON products.brand_id = brands.id
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Database query failed:", error);
            res.status(500).json({ error: "Database query failed" });
            return;
        }

        res.json(results);
    });
});


app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [name, email, hashedPassword, "user"],
            (error, result) => {
                if (error) {
                    console.error("Could not create user:", error);

                    return res.status(500).json({
                        message: "Could not create user"
                    });
                }

                res.status(201).json({
                    message: "User registered successfully"
                });
            }
        );

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (error, results) => {

        if (error) {
            console.error("Login error:", error);

            return res.status(500).json({
                message: "Server error"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Incorrect email or password"
            });
        }

        const user = results[0];

        const correctPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!correctPassword) {
            return res.status(401).json({
                message: "Incorrect email or password"
            });
        }

        const sessionId = crypto.randomBytes(32).toString("hex");

        const loggedInUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        sessions.set(sessionId, loggedInUser);

        res.cookie(
            "sessionId",
            sessionId,
            { httpOnly: true, sameSite: "lax", path: "/" } 
        );

        res.json({
            message: "Login successful",
            user: loggedInUser
        });
    });
});

app.get("/api/me", (req, res) => {

    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({
            message: "Not logged in"
        });
    }
    res.json({
        user: user
    });
});

app.post("/api/logout", (req, res) => {

    sessions.delete(req.cookies.sessionId);
    res.clearCookie("sessionId");

    res.json({
        message: "Logged out successfully"
    });
});


//lägg till produkter som admin
app.post("/api/products", requireAdmin, (req, res) => {
    const {
        name,
        brand_id,
        category,
        price,
        item_condition,
        description,
        image,
        color
    } = req.body;

    if (!name || !brand_id || !category || !price || !item_condition || !image || !color) {
        return res.status(400).json({
            message: "Please fill in all required fields"
        });
    }

    const sql = `
        INSERT INTO products
        (name, brand_id, category, price, item_condition, description, image, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            brand_id,
            category,
            price,
            item_condition,
            description,
            image,
            color
        ],
        (error, result) => {

            if (error) {
                console.error("Could not add product:", error);

                return res.status(500).json({
                    message: "Could not add product"
                });
            }

            res.status(201).json({
                message: "Product added successfully",
                id: result.insertId
            });
        }
    );
});
//radera produkter som admin
app.delete("/api/products/:id", requireAdmin, (req, res) => {
    const productId = req.params.id;

    const sql = "DELETE FROM products WHERE id = ?";

    db.query(sql, [productId], (error, result) => {

        if (error) {
            console.error("Could not delete product:", error);

            return res.status(500).json({
                message: "Could not delete product"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });
    });
});
//uppdatera produkter som admin
app.put("/api/products/:id", requireAdmin, (req, res) => {

    const productId = req.params.id;

    const {
        name,
        brand_id,
        category,
        price,
        item_condition,
        description,
        image,
        color
    } = req.body;

    if (
        !name ||
        !brand_id ||
        !category ||
        !price ||
        !item_condition ||
        !image ||
        !color
    ) {
        return res.status(400).json({
            message: "Please fill in all required fields"
        });
    }

    const sql = `
        UPDATE products
        SET name = ?,
            brand_id = ?,
            category = ?,
            price = ?,
            item_condition = ?,
            description = ?,
            image = ?,
            color = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name,
            brand_id,
            category,
            price,
            item_condition,
            description,
            image,
            color,
            productId
        ],
        (error, result) => {

            if (error) {
                console.error("Could not update product:", error);

                return res.status(500).json({
                    message: "Could not update product"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Product not found"
                });
            }

            res.json({
                message: "Product updated successfully"
            });
        }
    );
});

app.post("/api/favorites", (req, res) => {

    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({
            message: "Please login"
        });
    }

    const { product_id } = req.body;

    if (!product_id) {
        return res.status(400).json({
            message: "Product is required"
        });
    }

    const sql = `
        INSERT INTO favorites (user_id, product_id)
        VALUES (?, ?)
    `;

    db.query(sql, [user.id, product_id], (error) => {

        if (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(400).json({
                    message: "Product is already in favorites"
                });
            }

            console.error("Could not add favorite:", error);

            return res.status(500).json({
                message: "Could not add favorite"
            });
        }

        res.status(201).json({
            message: "Favorite added successfully"
        });
    });
});

app.get("/api/favorites", (req, res) => {

    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({
            message: "Please login"
        });
    }

    const sql = `
        SELECT
            products.id,
            products.name,
            brands.name AS brand,
            products.category,
            products.price,
            products.item_condition,
            products.description,
            products.image,
            products.color
        FROM favorites
        JOIN products
            ON favorites.product_id = products.id
        JOIN brands
            ON products.brand_id = brands.id
        WHERE favorites.user_id = ?
    `;

    db.query(sql, [user.id], (error, results) => {

        if (error) {
            console.error("Could not load favorites:", error);

            return res.status(500).json({
                message: "Could not load favorites"
            });
        }

        res.json(results);
    });
});

app.delete("/api/favorites/:productId", (req, res) => {

    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({
            message: "Please login"
        });
    }

    const productId = req.params.productId;

    const sql = `
        DELETE FROM favorites
        WHERE user_id = ? AND product_id = ?
    `;

    db.query(
        sql,
        [user.id, productId],
        (error, result) => {

            if (error) {
                console.error("Could not remove favorite:", error);

                return res.status(500).json({
                    message: "Could not remove favorite"
                });
            }

            res.json({
                message: "Favorite removed successfully"
            });
        }
    );
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});