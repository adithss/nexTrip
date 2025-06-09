const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");
const session = require("express-session");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Add session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Define routes BEFORE serving static files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use(express.static(__dirname));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "miniproject",
  password: "postgres",
  port: 5432,
});

// Create login table if it doesn't exist
const createLoginTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(50) UNIQUE NOT NULL,
        mailid VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log("Login table created successfully");
  } catch (error) {
    console.error("Error creating login table:", error);
  }
};

// Function to create user-specific itinerary table
const createUserTable = async (mailid) => {
  try {
    // Replace dots and special characters in email to create valid table name
    const tableName = `itinerary_${mailid.replace(/[@.]/g, "_")}`;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        itinerary_name VARCHAR(100) NOT NULL,
        number_of_days INTEGER NOT NULL,
        location VARCHAR(100) NOT NULL,
        hotel VARCHAR(100),
        restaurant TEXT[],
        attractions TEXT[],
        activities TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(`Table ${tableName} created successfully`);
    return true;
  } catch (error) {
    console.error(`Error creating table for ${mailid}:`, error);
    return false;
  }
};

createLoginTable();

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

    // Create user-specific itinerary table
    const tableCreated = await createUserTable(email);

    if (!tableCreated) {
      throw new Error("Failed to create user itinerary table");
    }

    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    if (error.code === "23505") {
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
    const result = await pool.query("SELECT * FROM login WHERE userid = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const user = result.rows[0];
    // Fixed the password verification - was using hash instead of compare
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Set session variables
    req.session.userid = user.userid;
    req.session.mailid = user.mailid;

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Error during login" });
  }
});

// Logout endpoint
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Error logging out" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Check session endpoint
app.get("/check-session", (req, res) => {
  if (req.session.userid) {
    res.json({
      loggedIn: true,
      userid: req.session.userid,
      mailid: req.session.mailid,
    });
  } else {
    res.json({ loggedIn: false });
  }
});
// Add these endpoints to server.js

// Save itinerary
app.post("/save-itinerary", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  const { location, startDate, numDays, days } = req.body;

  try {
    // Start transaction
    await pool.query("BEGIN");

    // Insert itinerary
    const itineraryResult = await pool.query(
      `INSERT INTO itineraries (user_id, itinerary_name, location, travel_date, number_of_days) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.session.userid, `Trip to ${location}`, location, startDate, numDays]
    );

    const itineraryId = itineraryResult.rows[0].id;

    // Insert daily activities
    for (const day of days) {
      await pool.query(
        `INSERT INTO daily_activities 
               (itinerary_id, day_number, hotel_name, hotel_photo, 
                restaurant_name, restaurant_photo, attraction_name, 
                attraction_photo, activity_name, activity_photo)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          itineraryId,
          day.dayNumber,
          day.hotel.name || null,
          day.hotel.photo || null,
          day.restaurant.name || null,
          day.restaurant.photo || null,
          day.attraction.name || null,
          day.attraction.photo || null,
          day.activity.name || null,
          day.activity.photo || null,
        ]
      );
    }

    await pool.query("COMMIT");
    res.json({ success: true, itineraryId });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error saving itinerary:", error);
    res.status(500).json({ success: false, message: "Error saving itinerary" });
  }
});

// Get user's itineraries
app.get("/user-itineraries", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const result = await pool.query(
      `SELECT i.*, 
                  json_agg(json_build_object(
                      'dayNumber', da.day_number,
                      'hotel', json_build_object('name', da.hotel_name, 'photo', da.hotel_photo),
                      'restaurant', json_build_object('name', da.restaurant_name, 'photo', da.restaurant_photo),
                      'attraction', json_build_object('name', da.attraction_name, 'photo', da.attraction_photo),
                      'activity', json_build_object('name', da.activity_name, 'photo', da.activity_photo)
                  )) as days
           FROM itineraries i
           LEFT JOIN daily_activities da ON i.id = da.itinerary_id
           WHERE i.user_id = $1
           GROUP BY i.id
           ORDER BY i.created_at DESC`,
      [req.session.userid]
    );

    res.json({ success: true, itineraries: result.rows });
  } catch (error) {
    console.error("Error fetching itineraries:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching itineraries" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
