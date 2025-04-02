// budget_tracker.js
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const tripSelectionSection = document.getElementById("trip-selection");
  const newTripFormSection = document.getElementById("new-trip-form");
  const tripDashboardSection = document.getElementById("trip-dashboard");
  const tripList = document.getElementById("trip-list");
  const tripTitle = document.getElementById("trip-title");
  const addTripBtn = document.getElementById("add-trip-btn");
  const createTripBtn = document.getElementById("create-trip-btn");
  const cancelTripBtn = document.getElementById("cancel-trip-btn");
  const tripNameInput = document.getElementById("trip-name");

  // Dashboard elements
  const splitBillBtn = document.getElementById("split-bill-btn");
  const viewExpensesBtn = document.getElementById("view-expenses-btn");
  const addMemberBtn = document.getElementById("add-member-btn");
  const splitBillForm = document.getElementById("split-bill-form");
  const expenseSummary = document.getElementById("expense-summary");
  const addMemberForm = document.getElementById("add-member-form");

  // Split bill form elements
  const categoryItems = document.querySelectorAll(".category-item");
  const billAmountInput = document.getElementById("bill-amount");
  const billDescriptionInput = document.getElementById("bill-description");
  const billDateInput = document.getElementById("bill-date");
  const splitMembersDiv = document.getElementById("split-members");
  const saveBillBtn = document.getElementById("save-bill-btn");
  const cancelBillBtn = document.getElementById("cancel-bill-btn");

  // Expense summary elements
  const balancesTab = document.getElementById("balances-tab");
  const expensesTab = document.getElementById("expenses-tab");
  const balancesContent = document.getElementById("balances-content");
  const expensesContent = document.getElementById("expenses-content");
  const userBalances = document.getElementById("user-balances");
  const settlementsList = document.getElementById("settlements-list");
  const expensesList = document.getElementById("expenses-list");
  const closeSummaryBtn = document.getElementById("close-summary-btn");

  // Add member form elements
  const memberNameInput = document.getElementById("member-name");
  const saveMemberBtn = document.getElementById("save-member-btn");
  const cancelMemberBtn = document.getElementById("cancel-member-btn");

  // State
  let currentGroupId = null;
  let currentGroupData = null;

  // Set today's date as default for bill date
  const today = new Date();
  const formattedDate = today.toISOString().substr(0, 10);
  if (billDateInput) {
    billDateInput.value = formattedDate;
  }

  // Event Listeners
  addTripBtn.addEventListener("click", showNewTripForm);
  createTripBtn.addEventListener("click", createNewTrip);
  cancelTripBtn.addEventListener("click", hideNewTripForm);

  if (splitBillBtn) splitBillBtn.addEventListener("click", showSplitBillForm);
  if (viewExpensesBtn)
    viewExpensesBtn.addEventListener("click", showExpenseSummary);
  if (addMemberBtn) addMemberBtn.addEventListener("click", showAddMemberForm);

  categoryItems.forEach((item) => {
    item.addEventListener("click", selectCategory);
  });

  if (saveBillBtn) saveBillBtn.addEventListener("click", saveExpense);
  if (cancelBillBtn) cancelBillBtn.addEventListener("click", hideSplitBillForm);

  if (balancesTab) balancesTab.addEventListener("click", showBalancesTab);
  if (expensesTab) expensesTab.addEventListener("click", showExpensesTab);
  if (closeSummaryBtn)
    closeSummaryBtn.addEventListener("click", hideExpenseSummary);

  if (saveMemberBtn) saveMemberBtn.addEventListener("click", addMember);
  if (cancelMemberBtn)
    cancelMemberBtn.addEventListener("click", hideAddMemberForm);

  // Initialize
  loadUserGroups();

  // Functions
  function showNewTripForm() {
    tripSelectionSection.classList.add("hidden");
    newTripFormSection.classList.remove("hidden");
    tripNameInput.focus();
  }

  function hideNewTripForm() {
    newTripFormSection.classList.add("hidden");
    tripSelectionSection.classList.remove("hidden");
    tripNameInput.value = "";
  }

  function createNewTrip() {
    const name = tripNameInput.value.trim();
    if (!name) {
      alert("Please enter a group name");
      return;
    }

    fetch("/create-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          hideNewTripForm();
          loadUserGroups();
        } else {
          alert(data.message || "Error creating group");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to create group");
      });
  }

  function loadUserGroups() {
    fetch("/user-groups")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayGroups(data.groups);
        } else {
          alert(data.message || "Error loading groups");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to load groups");
      });
  }

  //   function displayGroups(groups) {
  //     tripList.innerHTML = "";

  //     if (groups.length === 0) {
  //       tripList.innerHTML =
  //         '<p class="no-trips" >No groups found. Create one to get started!</p>';
  //       return;
  //     }

  //     groups.forEach((group) => {
  //       const tripCard = document.createElement("div");
  //       tripCard.className = "trip-card";
  //       tripCard.innerHTML = `
  //                 <h3 style="
  //     color: wheat;
  //     text-transform: capitalize;
  //     padding-bottom: 52px;
  //     font-size: 2rem;
  //     padding-top: 1px;
  // ">${group.name}</h3>
  //                 <p class="pgroupmember">${group.member_count} members</p>
  //                 <p class="pcreated">Created: ${new Date(
  //                   group.created_at
  //                 ).toLocaleDateString()}</p><br>   <button style="background: linear-gradient(45deg, #f44336, #012c2c); color: white; border: none; padding: 0.2rem 0.4rem;
  //     font-size: 0.7rem; cursor: pointer; border-radius: 0.5rem; transition: background-color 0.3s;"
  //             onmouseover="this.style.backgroundColor='darkred'"
  //             onmouseout="this.style.background='linear-gradient(45deg, #f44336, #012c2c)'">Delete</button>
  //             `;

  //       tripCard.addEventListener("click", () => openGroupDashboard(group.id));
  //       tripList.appendChild(tripCard);
  //     });
  //   }
  function displayGroups(groups) {
    tripList.innerHTML = "";

    if (groups.length === 0) {
      tripList.innerHTML =
        '<p class="no-trips">No groups found. Create one to get started!</p>';
      return;
    }

    groups.forEach((group) => {
      const tripCard = document.createElement("div");
      tripCard.className = "trip-card";
      tripCard.innerHTML = `
        <h3 style="color: wheat; text-transform: capitalize; padding-bottom: 52px; font-size: 2rem; padding-top: 1px;">${
          group.name
        }</h3>
        <p class="pgroupmember">${group.member_count} members</p>
        <p class="pcreated">Created: ${new Date(
          group.created_at
        ).toLocaleDateString()}</p><br>
        <button class="delete-group-btn" data-group-id="${
          group.id
        }" style="background: transparent; color: white; border: none; padding: 0.2rem 0.4rem; font-size: 0.7rem; cursor: pointer; border-radius: 0.5rem; transition: all 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'">Delete</button>
      `;

      // Add click event to the entire card
      tripCard.addEventListener("click", (e) => {
        // Only open dashboard if the click wasn't on the delete button
        if (!e.target.classList.contains("delete-group-btn")) {
          openGroupDashboard(group.id);
        }
      });

      tripList.appendChild(tripCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-group-btn").forEach((button) => {
      button.addEventListener("click", function (e) {
        // Stop event propagation to prevent the card click from firing
        e.stopPropagation();

        const groupId = this.getAttribute("data-group-id");
        if (
          confirm(
            "Are you sure you want to delete this group? This will delete all expenses and cannot be undone."
          )
        ) {
          deleteGroup(groupId);
        }
      });
    });
  }

  // The rest of your code remains unchanged
  async function deleteGroup(groupId) {
    try {
      const response = await fetch(`/delete-group/${groupId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the groups list
        fetchUserGroups();
        // Show success message
        alert("Group deleted successfully");
      } else {
        alert(data.message || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("An error occurred while deleting the group");
    }
  }

  async function fetchUserGroups() {
    try {
      const response = await fetch("/user-groups", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        displayGroups(data.groups);
      } else {
        console.error("Failed to fetch groups:", data.message);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  }
  function openGroupDashboard(groupId) {
    currentGroupId = groupId;

    fetch(`/group/${groupId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          currentGroupData = data;
          displayGroupDashboard(data);
        } else {
          alert(data.message || "Error loading group details");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to load group details");
      });
  }

  function displayGroupDashboard(data) {
    tripTitle.textContent = data.group.name;

    tripSelectionSection.classList.add("hidden");
    tripDashboardSection.classList.remove("hidden");

    // Hide all subsections
    splitBillForm.classList.add("hidden");
    // expenseSummary.classList.add("hidden");
    addMemberForm.classList.add("hidden");
    expenseSummary.classList.remove("hidden");
    showExpenseSummary();
    // console.log("Dashboard Opened - Expense Summary should be visible");
  }

  function showSplitBillForm() {
    // Hide other subsections
    expenseSummary.classList.add("hidden");
    addMemberForm.classList.add("hidden");

    // Reset form
    billAmountInput.value = "";
    billDescriptionInput.value = "";
    billDateInput.value = formattedDate;

    // Select default category
    categoryItems.forEach((item) => item.classList.remove("active"));
    categoryItems[0].classList.add("active");

    // Populate members
    populateSplitMembers();

    // Show form
    splitBillForm.classList.remove("hidden");
  }

  function hideSplitBillForm() {
    splitBillForm.classList.add("hidden");
  }

  function selectCategory() {
    categoryItems.forEach((item) => item.classList.remove("active"));
    this.classList.add("active");
  }

  function populateSplitMembers() {
    if (!currentGroupData) return;

    splitMembersDiv.innerHTML = "";

    currentGroupData.members.forEach((member) => {
      const memberDiv = document.createElement("div");
      memberDiv.className = "member-item";
      memberDiv.innerHTML = `
                <input type="checkbox" id="member-${member.userid}" value="${member.userid}" checked>
                <label for="member-${member.userid}">${member.userid}</label>
            `;
      splitMembersDiv.appendChild(memberDiv);
    });
  }

  function saveExpense() {
    const amount = parseFloat(billAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const description = billDescriptionInput.value.trim();
    if (!description) {
      alert("Please enter a description");
      return;
    }

    const date = billDateInput.value;
    if (!date) {
      alert("Please select a date");
      return;
    }

    const activeCategory = document.querySelector(".category-item.active");
    const category = activeCategory
      ? activeCategory.getAttribute("data-category")
      : "Others";

    const splitWithCheckboxes = document.querySelectorAll(
      '#split-members input[type="checkbox"]:checked'
    );
    if (splitWithCheckboxes.length === 0) {
      alert("Please select at least one person to split with");
      return;
    }

    const splitWith = Array.from(splitWithCheckboxes).map(
      (checkbox) => checkbox.value
    );

    const expenseData = {
      groupId: currentGroupId,
      description,
      amount,
      date,
      category,
      splitWith,
    };

    fetch("/add-expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expenseData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          hideSplitBillForm();
          // Refresh group data
          openGroupDashboard(currentGroupId);
        } else {
          alert(data.message || "Error adding expense");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to add expense");
      });
  }

  function showExpenseSummary() {
    // Hide other subsections
    splitBillForm.classList.add("hidden");
    addMemberForm.classList.add("hidden");

    fetch(`/settlement-summary/${currentGroupId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayBalanceSummary(data);
          displayExpenseList();

          // Show default tab
          showBalancesTab();

          // Show summary
          expenseSummary.classList.remove("hidden");
        } else {
          alert(data.message || "Error fetching settlement summary");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to fetch settlement summary");
      });
  }

  function hideExpenseSummary() {
    expenseSummary.classList.add("hidden");
  }

  function showBalancesTab() {
    balancesTab.classList.add("active");
    expensesTab.classList.remove("active");
    balancesContent.classList.remove("hidden");
    expensesContent.classList.add("hidden");
  }

  function showExpensesTab() {
    expensesTab.classList.add("active");
    balancesTab.classList.remove("active");
    expensesContent.classList.remove("hidden");
    balancesContent.classList.add("hidden");
  }

  // function displayBalanceSummary(data) {
  //   // Display user balances
  //   userBalances.innerHTML = "";

  //   Object.entries(data.balances).forEach(([userid, balance]) => {
  //     const userDiv = document.createElement("div");
  //     userDiv.className = "user-balance";

  //     const netAmount = parseFloat(balance.net).toFixed(2);
  //     const statusClass =
  //       netAmount > 0 ? "positive" : netAmount < 0 ? "negative" : "neutral";

  //     userDiv.innerHTML = `
  //               <div class="balance-user">${userid}</div>
  //               <div class="balance-details">
  //                   <div>Paid: $${parseFloat(balance.paid).toFixed(2)}</div>
  //                   <div>Owed: $${parseFloat(balance.owed).toFixed(2)}</div>
  //               </div>
  //               <div class="balance-net ${statusClass}">
  //                   ${
  //                     netAmount > 0
  //                       ? "Gets back"
  //                       : netAmount < 0
  //                       ? "Owes"
  //                       : "Settled"
  //                   }:
  //                   $${Math.abs(netAmount)}
  //               </div>
  //           `;

  //     userBalances.appendChild(userDiv);
  //   });

  //   // Display settlements
  //   settlementsList.innerHTML = "";

  //   if (data.settlements.length === 0) {
  //     settlementsList.innerHTML = "<p>All balances are settled!</p>";
  //     return;
  //   }

  //   data.settlements.forEach((settlement) => {
  //     const settlementDiv = document.createElement("div");
  //     settlementDiv.className = "settlement-item";
  //     settlementDiv.innerHTML = `
  //               <div>${settlement.from} pays ${settlement.to}</div>
  //               <div class="settlement-amount">$${parseFloat(
  //                 settlement.amount
  //               ).toFixed(2)}</div>
  //           `;

  //     settlementsList.appendChild(settlementDiv);
  //   });
  // }
  function displayBalanceSummary(data) {
    // Clear previous content
    userBalances.innerHTML = "";

    // Create a container for user balance tables
    const userBalanceTablesContainer = document.createElement("div");
    userBalanceTablesContainer.className = "user-balance-tables-container";

    // Process each user's balance
    Object.entries(data.balances).forEach(([userid, balance]) => {
      // Create a table for each user
      const userTableDiv = document.createElement("div");
      userTableDiv.className = "user-balance-table";

      // Create table structure
      const tableContent = `
            <div class="table-header">${userid}</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Due</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.balances)
                      .filter(([otherUserid]) => otherUserid !== userid)
                      .map(([otherUserid, otherBalance]) => {
                        // Calculate the amount this user owes to other users
                        const amountOwed = calculateAmountOwed(
                          data.balances,
                          userid,
                          otherUserid
                        );
                        return `
                                <tr>
                                    <td>${otherUserid}</td>
                                    <td>${
                                      amountOwed > 0
                                        ? "$" + amountOwed.toFixed(2)
                                        : "-"
                                    }</td>
                                </tr>
                            `;
                      })
                      .join("")}
                </tbody>
            </table>
            <div class="total-expense">Total Expense: $${parseFloat(
              balance.paid
            ).toFixed(2)}</div>
        `;

      userTableDiv.innerHTML = tableContent;
      userBalanceTablesContainer.appendChild(userTableDiv);
    });

    // Add the container to the main balances div
    userBalances.appendChild(userBalanceTablesContainer);

    // Display settlements
    settlementsList.innerHTML = "";
    if (data.settlements.length === 0) {
      settlementsList.innerHTML = "<p>All balances are settled!</p>";
      return;
    }

    data.settlements.forEach((settlement) => {
      const settlementDiv = document.createElement("div");
      settlementDiv.className = "settlement-item";
      settlementDiv.innerHTML = `
            <div>${settlement.from} pays ${settlement.to}</div>
            <div class="settlement-amount">$${parseFloat(
              settlement.amount
            ).toFixed(2)}</div>
        `;
      settlementsList.appendChild(settlementDiv);
    });
  }

  // Helper function to calculate amount owed between two specific users
  function calculateAmountOwed(balances, fromUser, toUser) {
    // This is a simplified calculation and should match your backend logic
    const netFrom = parseFloat(balances[fromUser].net);
    const netTo = parseFloat(balances[toUser].net);

    // If fromUser owes money overall and toUser is owed money
    if (netFrom < 0 && netTo > 0) {
      // Calculate the amount owed
      return Math.min(Math.abs(netFrom), netTo);
    }

    return 0;
  }
  function displayExpenseList() {
    if (!currentGroupData || !currentGroupData.expenses) return;

    expensesList.innerHTML = "";

    if (currentGroupData.expenses.length === 0) {
      expensesList.innerHTML = "<p>No expenses yet.</p>";
      return;
    }

    currentGroupData.expenses.forEach((expense) => {
      const expenseDate = new Date(expense.expense_date).toLocaleDateString();

      const expenseDiv = document.createElement("div");
      expenseDiv.className = "expense-item";
      expenseDiv.innerHTML = `
        <div class="expense-header">
            <div class="expense-description">${expense.description}</div>
            <div class="expense-amount">$${parseFloat(expense.amount).toFixed(
              2
            )}</div>
        </div>
        <div class="expense-details">
            <div>Paid by: ${expense.paid_by_name}</div>
            <div>Date: ${expenseDate}</div>
            <div>Category: ${expense.category}</div>
            <button class="delete-expense-btn" data-expense-id="${
              expense.id
            }">Delete</button>
        </div>
      `;

      expensesList.appendChild(expenseDiv);
    });

    // Add event listeners to the delete buttons
    document.querySelectorAll(".delete-expense-btn").forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation(); // Prevent event bubbling
        const expenseId = this.getAttribute("data-expense-id");
        if (confirm("Are you sure you want to delete this expense?")) {
          deleteExpense(expenseId);
        }
      });
    });
  }
  function deleteExpense(expenseId) {
    fetch(`/delete-expense/${expenseId}`, {
      method: "DELETE",
      credentials: "include", // Include session cookies
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Refresh group data to update the expenses list and balances
          openGroupDashboard(currentGroupId);
          alert("Expense deleted successfully");
        } else {
          alert(data.message || "Failed to delete expense");
        }
      })
      .catch((error) => {
        console.error("Error deleting expense:", error);
        alert("An error occurred while deleting the expense");
      });
  }
  function showAddMemberForm() {
    // Hide other subsections
    splitBillForm.classList.add("hidden");
    expenseSummary.classList.add("hidden");

    // Reset form
    memberNameInput.value = "";

    // Show form
    addMemberForm.classList.remove("hidden");
  }

  function hideAddMemberForm() {
    addMemberForm.classList.add("hidden");
  }

  function addMember() {
    const username = memberNameInput.value.trim();
    if (!username) {
      alert("Please enter a username");
      return;
    }

    fetch("/add-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupId: currentGroupId,
        username,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          hideAddMemberForm();
          // Refresh group data
          openGroupDashboard(currentGroupId);
        } else {
          alert(data.message || "Error adding member");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to add member");
      });
  }
});
