const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Recognize HTTPS connections forwarded by Render.
if (isProduction) {
    app.set("trust proxy", 1);
}

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction
    }
}));


// Test route
app.get("/api/health", (req, res) => {
    res.json({ message: "Server is running" });
});

// Get all inventory items
app.get("/api/items", async (req, res) => {
    try {
        const items = await db("items")
            .join("users", "items.user_id", "users.id")
            .select("items.*", "users.username");
        res.json(items);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not get items" });
    }
});

// Register a User
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password, first_name, last_name } = req.body;

        if (!username || !email || !password || !first_name || !last_name) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await db("users")
            .where("email", email)
            .first();

        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [user] = await db("users")
            .insert({
                username: username,
                email: email,
                password_hash: hashedPassword,
                first_name: first_name,
                last_name: last_name
            })
            .returning(["id", "username", "email", "first_name", "last_name"]);

        res.status(201).json(user);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not register user" });
    }
});

// Login info
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await db("users")
            .where("email", email)
            .first();

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        req.session.userId = user.id;
        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not log in" });
    }
});

// CHecks the current user
app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        const user = await db("users")
            .select("id", "username", "email")
            .where("id", req.session.userId)
            .first();

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not get user" });
    }
});

// logs user session out on the backend
app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// links item to user
app.post("/api/items", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        const { name, description, quantity } = req.body;

        if (!name || quantity === undefined || quantity === null) {
            return res.status(400).json({ error: "Name and quantity are required" });
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ error: "Quantity must be a whole number of zero or more" });
        }

        const [item] = await db("items")
            .insert({
                user_id: req.session.userId,
                name: name,
                description: description,
                quantity: quantity
            })
            .returning("*");

        res.status(201).json(item);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not create item" });
    }
});

// filters items to user
app.get("/api/my-items", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        const items = await db("items")
            .where("user_id", req.session.userId)
            .select("*");

        res.json(items);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not get your items" });
    }
});

// filters by id
app.get("/api/items/:id", async (req, res) => {
    try {
        const item = await db("items")
            .join("users", "items.user_id", "users.id")
            .select("items.*", "users.username")
            .where("items.id", req.params.id)
            .first();

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json(item);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not get item" });
    }
});

// updates if logged in, item existsw, and logged in user owns it
app.put("/api/items/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        const { name, description, quantity } = req.body;

        if (!name || !Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ error: "Invalid name or quantity" });
        }

        const item = await db("items")
            .where("id", req.params.id)
            .first();

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        if (item.user_id !== req.session.userId) {
            return res.status(403).json({ error: "You cannot edit this item" });
        }

        const [updatedItem] = await db("items")
            .where("id", req.params.id)
            .update({
                name: name,
                description: description,
                quantity: quantity,
                updated_at: db.fn.now()
            })
            .returning("*");

        res.json(updatedItem);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not update item" });
    }
});

// same as PUT but will delete
app.delete("/api/items/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        const item = await db("items")
            .where("id", req.params.id)
            .first();

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        if (item.user_id !== req.session.userId) {
            return res.status(403).json({ error: "You cannot delete this item" });
        }

        await db("items")
            .where("id", req.params.id)
            .del();

        res.json({ message: "Item deleted successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not delete item" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
