const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Define routes BEFORE serving static files
// Serve landing.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

// Add a route for the login/register page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve static files from the current directory
// This should come AFTER the route definitions
app.use(express.static(__dirname));

// PostgreSQL connection configuration
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "miniproject",
  password: "postgres",
  port: 5432,
});

// Create table if it doesn't exist
const createTable = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS login (
                id SERIAL PRIMARY KEY,
                userid VARCHAR(50) UNIQUE NOT NULL,
                mailid VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `);
    console.log("Table created successfully");
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

createTable();

// Register endpoint
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const result = await pool.query(
      "INSERT INTO login (userid, mailid, password) VALUES ($1, $2, $3) RETURNING id",
      [username, email, hashedPassword]
    );

    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    if (error.code === "23505") {
      // Unique violation error code
      res
        .status(400)
        .json({ success: false, message: "Username or email already exists" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Error during registration" });
    }
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user in database
    const result = await pool.query("SELECT * FROM login WHERE userid = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Check password
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Error during login" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
