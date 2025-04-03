require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const session = require("express-session");
const fs = require("fs");

const app = express();
// app.use(
//   cors({
//     origin: "https://nextrip.onrender.com",
//     credentials: true,
//   })
// );
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.RENDER_EXTERNAL_URL || "https://nextrip.onrender.com"
        : "https://nextrip.onrender.com",
    credentials: true,
  })
);
app.use(express.json());

// Add session middleware BEFORE defining routes
app.use(
  session({
    secret: "your-secret-key", // Change this to a strong, random secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using https
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
    },
  })
);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "travel_documents",
    allowed_formats: ["jpg", "png", "pdf"],
    resource_type: (req, file) => {
      if (
        file.mimetype === "application/pdf" ||
        file.originalname.toLowerCase().endsWith(".pdf")
      ) {
        return "raw"; // Use 'raw' for PDFs instead of 'image'
      }
      return "image";
    },
    public_id: (req, file) => {
      // Remove extension from filename to avoid duplicates (.pdf.pdf)
      const fileName = file.originalname;
      const name = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
      return Date.now() + "-" + name;
    },
  },
});

const upload = multer({ storage });
// Serve static files BEFORE defining specific routes
app.use(express.static(__dirname));
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userid) {
    return next();
  }
  res.status(401).json({ success: false, message: "Not logged in" });
  res.sendFile(path.join(__dirname, "landing.html"));
};
// Now define specific routes that should override static files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});
app.get("/home", isAuthenticated, (req, res) => {
  // Read the HTML file
  fs.readFile(path.join(__dirname, "home.html"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading home.html:", err);
      return res.status(500).send("Error loading page");
    }

    // Make sure to log the key (for debugging only, remove after)
    console.log("Using Maps API Key:", process.env.GOOGLE_MAPS_API_KEY);

    // Replace the placeholder with the actual API key
    const modifiedHtml = data.replace(
      '<script src="https://maps.googleapis.com/maps/api/js?key=googlesecretkeys&libraries=places"></script>',
      `<script src="https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places"></script>`
    );

    // Send the modified HTML
    res.send(modifiedHtml);
  });
});

app.get("/results", isAuthenticated, (req, res) => {
  // Read the HTML file
  fs.readFile(path.join(__dirname, "results.html"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading home.html:", err);
      return res.status(500).send("Error loading page");
    }

    // Make sure to log the key (for debugging only, remove after)
    console.log("Using Maps API Key:", process.env.GOOGLE_MAPS_API_KEY);

    // Replace the placeholder with the actual API key
    const modifiedHtml = data.replace(
      '<script src="https://maps.googleapis.com/maps/api/js?key=googlesecretkeys&libraries=places"></script>',
      `<script src="https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places"></script>`
    );

    // Send the modified HTML
    res.send(modifiedHtml);
  });
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Needed for Render PostgreSQL
  },
});

// Create all necessary tables if they don't exist
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(50) UNIQUE NOT NULL,
        mailid VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES login(userid),
        itinerary_name VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        travel_date DATE,
        number_of_days INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_activities (
        id SERIAL PRIMARY KEY,
        itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL,
        hotel_name VARCHAR(100),
        hotel_photo TEXT,
        restaurant_name VARCHAR(100),
        restaurant_photo TEXT,
        attraction_name VARCHAR(100),
        attraction_photo TEXT,
        activity_name VARCHAR(100),
        activity_photo TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_by VARCHAR(50) NOT NULL REFERENCES login(userid),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES trip_groups(id) ON DELETE CASCADE,
        userid VARCHAR(50) REFERENCES login(userid),
        UNIQUE(group_id, userid)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES trip_groups(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        paid_by VARCHAR(50) REFERENCES login(userid),
        expense_date DATE NOT NULL,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_shares (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
        userid VARCHAR(50) REFERENCES login(userid),
        amount DECIMAL(10,2) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES trip_groups(id) ON DELETE CASCADE,
        from_user VARCHAR(50) REFERENCES login(userid),
        to_user VARCHAR(50) REFERENCES login(userid),
        amount DECIMAL(10,2) NOT NULL,
        settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES login(userid),
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

// Call the function to create tables
createTables();

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
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Set session variables
    req.session.userid = user.userid;
    req.session.mailid = user.mailid;
    req.session.isLoggedIn = true; // Add this flag for easier checks

    // Save session before responding
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error during login" });
      }
      res.json({ success: true, message: "Login successful" });
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Error during login" });
  }
});

// Middleware to check if user is logged in

// Logout endpoint
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Error logging out" });
    }
    res.clearCookie("connect.sid"); // Clear session cookie
    res.sendFile(path.join(__dirname, "landing.html"));
  });
});

// Check session endpoint
app.get("/check-session", (req, res) => {
  if (req.session && req.session.userid) {
    res.json({
      loggedIn: true,
      userid: req.session.userid,
      mailid: req.session.mailid,
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Upload File Route (Protected)
app.post(
  "/upload",
  isAuthenticated,
  upload.single("file"),
  async (req, res) => {
    try {
      const { originalname, mimetype } = req.file;
      const fileUrl = req.file.path; // Cloudinary URL

      const result = await pool.query(
        "INSERT INTO documents (user_id, file_name, file_url, file_type) VALUES ($1, $2, $3, $4) RETURNING *",
        [req.session.userid, originalname, fileUrl, mimetype]
      );

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Fetch User-Specific Documents (Protected)
app.get("/documents", isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM documents WHERE user_id = $1",
      [req.session.userid]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Document (Protected)
app.delete("/document/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await pool.query(
      "SELECT * FROM documents WHERE id = $1 AND user_id = $2",
      [id, req.session.userid]
    );
    if (doc.rows.length === 0)
      return res.status(404).json({ error: "Document not found" });

    const publicId = doc.rows[0].file_url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);
    await pool.query("DELETE FROM documents WHERE id = $1", [id]);

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save itinerary - Use authentication middleware
app.post("/save-itinerary", isAuthenticated, async (req, res) => {
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
          day.hotel?.name || null,
          day.hotel?.photo || null,
          day.restaurant?.name || null,
          day.restaurant?.photo || null,
          day.attraction?.name || null,
          day.attraction?.photo || null,
          day.activity?.name || null,
          day.activity?.photo || null,
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
app.get("/budget_tracker", (req, res) => {
  res.sendFile(path.join(__dirname, "budget_tracker.html"));
});
app.get("/file", (req, res) => {
  res.sendFile(path.join(__dirname, "file.html"));
});
app.get("/manage-itineraries", (req, res) => {
  res.sendFile(path.join(__dirname, "manage-itineraries.html"));
});

// Get user's itineraries - Use authentication middleware
app.get("/user-itineraries", isAuthenticated, async (req, res) => {
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
// Delete itinerary - Use authentication middleware
app.delete(
  "/delete-itinerary/:itineraryId",
  isAuthenticated,
  async (req, res) => {
    const { itineraryId } = req.params;

    try {
      // Check if user is the owner of the itinerary
      const itineraryCheck = await pool.query(
        "SELECT * FROM itineraries WHERE id = $1 AND user_id = $2",
        [itineraryId, req.session.userid]
      );

      if (itineraryCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this itinerary",
        });
      }

      // Start transaction
      await pool.query("BEGIN");

      // Delete all daily activities first
      await pool.query("DELETE FROM daily_activities WHERE itinerary_id = $1", [
        itineraryId,
      ]);

      // Then delete the itinerary
      await pool.query("DELETE FROM itineraries WHERE id = $1", [itineraryId]);

      await pool.query("COMMIT");

      res.json({ success: true, message: "Itinerary deleted successfully" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error deleting itinerary:", error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting itinerary" });
    }
  }
);

// Create a new trip group - Use authentication middleware
app.post("/create-group", isAuthenticated, async (req, res) => {
  const { name } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO trip_groups (name, created_by) VALUES ($1, $2) RETURNING id",
      [name, req.session.userid]
    );

    // Add creator as a member of the group
    await pool.query(
      "INSERT INTO group_members (group_id, userid) VALUES ($1, $2)",
      [result.rows[0].id, req.session.userid]
    );

    res.json({ success: true, groupId: result.rows[0].id });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ success: false, message: "Error creating group" });
  }
});

// Get user's groups - Use authentication middleware
app.get("/user-groups", isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.created_at, g.created_by,
                (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
         FROM trip_groups g
         JOIN group_members m ON g.id = m.group_id
         WHERE m.userid = $1
         ORDER BY g.created_at DESC`,
      [req.session.userid]
    );

    res.json({ success: true, groups: result.rows });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ success: false, message: "Error fetching groups" });
  }
});

// Get group details - Use authentication middleware
app.get("/group/:groupId", isAuthenticated, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Check if user is a member of this group
    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND userid = $2",
      [groupId, req.session.userid]
    );

    if (memberCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this group" });
    }

    // Get group details
    const groupResult = await pool.query(
      "SELECT * FROM trip_groups WHERE id = $1",
      [groupId]
    );

    // Get group members
    const membersResult = await pool.query(
      `SELECT gm.userid, l.mailid 
         FROM group_members gm
         JOIN login l ON gm.userid = l.userid
         WHERE gm.group_id = $1`,
      [groupId]
    );

    // Get expenses
    const expensesResult = await pool.query(
      `SELECT e.*, l.userid as paid_by_name
         FROM expenses e
         JOIN login l ON e.paid_by = l.userid
         WHERE e.group_id = $1
         ORDER BY e.expense_date DESC`,
      [groupId]
    );

    // Get expense shares
    const sharesResult = await pool.query(
      `SELECT es.*, e.id as expense_id, l.userid as username
         FROM expense_shares es
         JOIN expenses e ON es.expense_id = e.id
         JOIN login l ON es.userid = l.userid
         WHERE e.group_id = $1`,
      [groupId]
    );

    // Calculate balances
    const balances = calculateBalances(expensesResult.rows, sharesResult.rows);

    res.json({
      success: true,
      group: groupResult.rows[0],
      members: membersResult.rows,
      expenses: expensesResult.rows,
      balances: balances,
    });
  } catch (error) {
    console.error("Error fetching group details:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching group details" });
  }
});

// Helper function to calculate balances
function calculateBalances(expenses, shares) {
  const balances = {};

  // Initialize balances for all users
  shares.forEach((share) => {
    if (!balances[share.userid]) {
      balances[share.userid] = { paid: 0, owed: 0, net: 0 };
    }
  });

  // Process expenses
  expenses.forEach((expense) => {
    if (!balances[expense.paid_by]) {
      balances[expense.paid_by] = { paid: 0, owed: 0, net: 0 };
    }
    balances[expense.paid_by].paid += parseFloat(expense.amount);
  });

  // Process shares
  shares.forEach((share) => {
    balances[share.userid].owed += parseFloat(share.amount);
  });

  // Calculate net balance
  Object.keys(balances).forEach((userid) => {
    balances[userid].net = balances[userid].paid - balances[userid].owed;
  });

  return balances;
}

// Add member to group - Use authentication middleware
app.post("/add-member", isAuthenticated, async (req, res) => {
  const { groupId, username } = req.body;

  try {
    // Check if user exists
    const userCheck = await pool.query(
      "SELECT * FROM login WHERE userid = $1",
      [username]
    );

    if (userCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the current user is a member of this group
    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND userid = $2",
      [groupId, req.session.userid]
    );

    if (memberCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Check if user is already a member
    const existingMember = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND userid = $2",
      [groupId, username]
    );

    if (existingMember.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User is already a member" });
    }

    // Add user to group
    await pool.query(
      "INSERT INTO group_members (group_id, userid) VALUES ($1, $2)",
      [groupId, username]
    );

    res.json({ success: true, message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ success: false, message: "Error adding member" });
  }
});

// Add expense - Use authentication middleware
app.post("/add-expense", isAuthenticated, async (req, res) => {
  const { groupId, description, amount, date, category, splitWith } = req.body;

  try {
    // Check if user is a member of this group
    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND userid = $2",
      [groupId, req.session.userid]
    );

    if (memberCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this group" });
    }

    // Start transaction
    await pool.query("BEGIN");

    // Add expense
    const expenseResult = await pool.query(
      "INSERT INTO expenses (group_id, description, amount, paid_by, expense_date, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [groupId, description, amount, req.session.userid, date, category]
    );

    const expenseId = expenseResult.rows[0].id;
    const splitAmount = (amount / splitWith.length).toFixed(2);

    // Add expense shares
    for (const userid of splitWith) {
      await pool.query(
        "INSERT INTO expense_shares (expense_id, userid, amount) VALUES ($1, $2, $3)",
        [expenseId, userid, splitAmount]
      );
    }

    await pool.query("COMMIT");

    res.json({ success: true, expenseId: expenseId });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, message: "Error adding expense" });
  }
});

// Get settlement summary - Use authentication middleware
app.get("/settlement-summary/:groupId", isAuthenticated, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Check if user is a member of this group
    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND userid = $2",
      [groupId, req.session.userid]
    );

    if (memberCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this group" });
    }

    // Get all expenses and shares for the group
    const expensesResult = await pool.query(
      "SELECT * FROM expenses WHERE group_id = $1",
      [groupId]
    );

    const sharesResult = await pool.query(
      `SELECT es.* 
         FROM expense_shares es
         JOIN expenses e ON es.expense_id = e.id
         WHERE e.group_id = $1`,
      [groupId]
    );

    // Get all members
    const membersResult = await pool.query(
      `SELECT gm.userid, l.mailid
         FROM group_members gm
         JOIN login l ON gm.userid = l.userid
         WHERE gm.group_id = $1`,
      [groupId]
    );

    // Calculate balances
    const balances = calculateBalances(expensesResult.rows, sharesResult.rows);

    // Calculate settlements
    const settlements = calculateSettlements(balances);

    res.json({
      success: true,
      balances: balances,
      settlements: settlements,
      members: membersResult.rows,
    });
  } catch (error) {
    console.error("Error generating settlement summary:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating settlement summary" });
  }
});

// Helper function to calculate settlements
function calculateSettlements(balances) {
  const settlements = [];
  const creditors = [];
  const debtors = [];

  // Separate users into creditors and debtors
  Object.entries(balances).forEach(([userid, balance]) => {
    if (balance.net > 0) {
      creditors.push({ userid, amount: balance.net });
    } else if (balance.net < 0) {
      debtors.push({ userid, amount: -balance.net });
    }
  });

  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Calculate settlements
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const amount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      from: debtor.userid,
      to: creditor.userid,
      amount: amount.toFixed(2),
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount <= 0.01) {
      creditors.shift();
    }

    if (debtor.amount <= 0.01) {
      debtors.shift();
    }
  }

  return settlements;
}

// Record settlement - Use authentication middleware
app.post("/record-settlement", isAuthenticated, async (req, res) => {
  const { groupId, toUser, amount } = req.body;

  try {
    // Check if user is a member of this group
    const memberCheck = await pool.query(
      "SELECT * FROM group_members WHERE group_id = $1 AND userid = $2",
      [groupId, req.session.userid]
    );

    if (memberCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this group" });
    }

    // Record settlement
    await pool.query(
      "INSERT INTO settlements (group_id, from_user, to_user, amount) VALUES ($1, $2, $3, $4)",
      [groupId, req.session.userid, toUser, amount]
    );

    res.json({ success: true, message: "Settlement recorded successfully" });
  } catch (error) {
    console.error("Error recording settlement:", error);
    res
      .status(500)
      .json({ success: false, message: "Error recording settlement" });
  }
});

// Optional route for debugging sessions
app.get("/debug-session", (req, res) => {
  res.json({
    sessionExists: !!req.session,
    sessionData: req.session,
  });
});
// Delete group - Use authentication middleware
app.delete("/delete-group/:groupId", isAuthenticated, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Check if user is the creator of the group
    const groupCheck = await pool.query(
      "SELECT * FROM trip_groups WHERE id = $1 AND created_by = $2",
      [groupId, req.session.userid]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this group",
      });
    }

    // Start transaction
    await pool.query("BEGIN");

    // Delete all expense shares first
    await pool.query(
      `
      DELETE FROM expense_shares
      WHERE expense_id IN (
        SELECT id FROM expenses WHERE group_id = $1
      )
    `,
      [groupId]
    );

    // Delete all expenses
    await pool.query("DELETE FROM expenses WHERE group_id = $1", [groupId]);

    // Delete all settlements
    await pool.query("DELETE FROM settlements WHERE group_id = $1", [groupId]);

    // Delete all group members
    await pool.query("DELETE FROM group_members WHERE group_id = $1", [
      groupId,
    ]);

    // Finally, delete the group itself
    await pool.query("DELETE FROM trip_groups WHERE id = $1", [groupId]);

    await pool.query("COMMIT");

    res.json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error deleting group:", error);
    res.status(500).json({ success: false, message: "Error deleting group" });
  }
});
// Delete expense - Use authentication middleware
app.delete("/delete-expense/:expenseId", isAuthenticated, async (req, res) => {
  const { expenseId } = req.params;

  try {
    // Check if expense exists and user is authorized to delete it
    const expenseCheck = await pool.query(
      `SELECT e.*
       FROM expenses e
       JOIN group_members gm ON e.group_id = gm.group_id
       WHERE e.id = $1 AND gm.userid = $2`,
      [expenseId, req.session.userid]
    );

    if (expenseCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this expense",
      });
    }

    // Start transaction
    await pool.query("BEGIN");

    // Delete all expense shares first
    await pool.query("DELETE FROM expense_shares WHERE expense_id = $1", [
      expenseId,
    ]);

    // Then delete the expense
    await pool.query("DELETE FROM expenses WHERE id = $1", [expenseId]);

    await pool.query("COMMIT");

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error deleting expense:", error);
    res.status(500).json({ success: false, message: "Error deleting expense" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
