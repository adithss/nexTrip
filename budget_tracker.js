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

  function displayGroups(groups) {
    tripList.innerHTML = "";

    if (groups.length === 0) {
      tripList.innerHTML =
        '<p class="no-trips" >No groups found. Create one to get started!</p>';
      return;
    }

    groups.forEach((group) => {
      const tripCard = document.createElement("div");
      tripCard.className = "trip-card";
      tripCard.innerHTML = `
                <h3>${group.name}</h3>
                <p>${group.member_count} members</p>
                <p>Created: ${new Date(
                  group.created_at
                ).toLocaleDateString()}</p>
            `;

      tripCard.addEventListener("click", () => openGroupDashboard(group.id));
      tripList.appendChild(tripCard);
    });
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
    expenseSummary.classList.add("hidden");
    addMemberForm.classList.add("hidden");
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

  function displayBalanceSummary(data) {
    // Display user balances
    userBalances.innerHTML = "";

    Object.entries(data.balances).forEach(([userid, balance]) => {
      const userDiv = document.createElement("div");
      userDiv.className = "user-balance";

      const netAmount = parseFloat(balance.net).toFixed(2);
      const statusClass =
        netAmount > 0 ? "positive" : netAmount < 0 ? "negative" : "neutral";

      userDiv.innerHTML = `
                <div class="balance-user">${userid}</div>
                <div class="balance-details">
                    <div>Paid: $${parseFloat(balance.paid).toFixed(2)}</div>
                    <div>Owed: $${parseFloat(balance.owed).toFixed(2)}</div>
                </div>
                <div class="balance-net ${statusClass}">
                    ${
                      netAmount > 0
                        ? "Gets back"
                        : netAmount < 0
                        ? "Owes"
                        : "Settled"
                    }: 
                    $${Math.abs(netAmount)}
                </div>
            `;

      userBalances.appendChild(userDiv);
    });

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
                    <div class="expense-description">${
                      expense.description
                    }</div>
                    <div class="expense-amount">$${parseFloat(
                      expense.amount
                    ).toFixed(2)}</div>
                </div>
                <div class="expense-details">
                    <div>Paid by: ${expense.paid_by_name}</div>
                    <div>Date: ${expenseDate}</div>
                    <div>Category: ${expense.category}</div>
                </div>
            `;

      expensesList.appendChild(expenseDiv);
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
