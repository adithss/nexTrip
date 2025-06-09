// budget_tracker_routes.js - Add these to your server.js file

// Create a new trip group
app.post("/create-group", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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

// Get user's groups
app.get("/user-groups", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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

// Get group details
app.get("/group/:groupId", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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

// Add member to group
app.post("/add-member", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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

// Add expense
app.post("/add-expense", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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

// Get settlement summary
app.get("/settlement-summary/:groupId", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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

// Record settlement
app.post("/record-settlement", async (req, res) => {
  if (!req.session.userid) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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
