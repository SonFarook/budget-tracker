"use strict";

// DOM Elements

const dateInput = document.querySelector(".date-picker");
const amountInput = document.querySelector(".transaction-amount");
const descriptionInput = document.querySelector(".transaction-description");
const errorMessage = document.querySelector(".error");
const transactionTypeRadios = document.querySelectorAll('input[type="radio"]');
const revenueRadio = document.querySelector("#revenue");

const balanceDisplay = document.querySelector(".balance");
const spendingDisplay = document.querySelector(".spending");
const revenueDisplay = document.querySelector(".revenue");
const addTransactionButton = document.querySelector(".add-transaction");
const transactionsContainer = document.querySelector(".transactions");

// Variables

const transactions = [];
const today = new Date().toISOString().split("T")[0];

let totalBalance = 0;
let totalRevenue = 0;
let totalSpending = 0;

// Functions

const formatCurrency = (value) => value.toFixed(2).replace(".", ",") + " €";

const displayError = (message) => {
  errorMessage.textContent = message;
  errorMessage.classList.remove("collapse");
};

const updateAddButtonState = () => {
  addTransactionButton.disabled = !errorMessage.classList.contains("collapse");
};

const isRadioSelected = () =>
  [...transactionTypeRadios].some((radio) => radio.checked);

const validateInputs = () => {
  const dateValue = new Date(dateInput.value);
  const minDate = new Date(dateInput.min);
  const maxDate = new Date(dateInput.max);

  if (!amountInput.value) {
    displayError("Please enter a transaction amount.");
  } else if (!isRadioSelected()) {
    displayError("Please select a transaction type.");
  } else if (dateValue < minDate || dateValue > maxDate) {
    displayError("Date must be between 2010 and 2045.");
  } else {
    errorMessage.classList.add("collapse");
  }

  updateAddButtonState();
};

const resetForm = () => {
  amountInput.value = "";
  descriptionInput.value = "";
  transactionTypeRadios.forEach((radio) => (radio.checked = false));
  dateInput.value = today;
  addTransactionButton.disabled = true;
};

const updateTotalsUI = () => {
  balanceDisplay.textContent = formatCurrency(totalBalance);
  spendingDisplay.textContent = formatCurrency(totalSpending);
  revenueDisplay.textContent = formatCurrency(totalRevenue);
};

const renderTransaction = (transaction) => {
  const html = `
    <div class="flex gap-2 transaction" data-id="${transaction.id}">
      <p>${transaction.type === "revenue" ? "+" : "-"}${transaction.amount} €</p>
      <p>${transaction.description}</p>
      <p>${transaction.date}</p>
        <button
          class="rounded-full bg-black text-white hover:bg-gray-800 hover:cursor-pointer active:bg-gray-700"
          >
            Delete
      </button>
    </div>
  `;
  transactionsContainer.insertAdjacentHTML("beforeend", html);
};

const addTransaction = () => {
  const amount = parseFloat(amountInput.value.replace(",", "."));
  const type = revenueRadio.checked ? "revenue" : "spending";

  if (type === "revenue") {
    totalBalance += amount;
    totalRevenue += amount;
  } else {
    totalBalance -= amount;
    totalSpending -= amount;
  }

  const newTransaction = {
    id: Date.now(),
    amount: amountInput.value,
    type: type,
    date: dateInput.value,
    description: descriptionInput.value,
  };

  transactions.push(newTransaction);
  saveTransactions();
  console.log(localStorage.getItem("transactions"));
  renderTransaction(newTransaction);
  updateTotalsUI();
  resetForm();
};

const removeTransaction = (id) => {
  const index = transactions.findIndex((t) => t.id === id);
  const selectedTransaction = transactions[index];

  if (selectedTransaction.type === "revenue") {
    totalBalance -= selectedTransaction.amount;
    totalRevenue -= selectedTransaction.amount;
  } else {
    totalBalance += Number(selectedTransaction.amount);
    totalSpending += Number(selectedTransaction.amount);
  }
  transactions.splice(index, 1);
  saveTransactions();
  updateTotalsUI();
};

// Localstorage functions

const saveTransactions = function () {
  localStorage.setItem("transactions", JSON.stringify(transactions));
};

const loadTransactions = function () {
  const savedTransactions = localStorage.getItem("transactions");

  if (savedTransactions) {
    const parsedTransactions = JSON.parse(savedTransactions);

    parsedTransactions.forEach((transaction) => {
      transactions.push(transaction);
      renderTransaction(transaction);

      console.log(transaction.type);

      if (transaction.type === "spending") {
        totalBalance -= Number(transaction.amount);
        totalSpending -= Number(transaction.amount);
      } else {
        totalBalance += Number(transaction.amount);
        totalRevenue += Number(transaction.amount);
      }
    });

    updateTotalsUI();
  }
};

// Event Listeners

addTransactionButton.addEventListener("click", addTransaction);

amountInput.addEventListener("input", () => {
  let cleaned = amountInput.value.replace(/[^0-9,]/g, "");
  const parts = cleaned.split(",");

  if (parts.length > 1) {
    cleaned = cleaned.replace(/(,.*?),/g, "$1");
    if (parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
      cleaned = parts.join(",");
    }
  }

  amountInput.value = cleaned;
  validateInputs();
});

amountInput.addEventListener("paste", (event) => {
  event.preventDefault();
  const pasted = event.clipboardData.getData("text").replace(/[^0-9,]/g, "");
  const parts = pasted.split(",");
  if (parts.length > 2) {
    parts[1] = parts[1].slice(0, 2);
    while (parts.length > 1) parts.pop();
  }
  amountInput.value = parts.join(",");
});

transactionTypeRadios.forEach((radio) =>
  radio.addEventListener("change", validateInputs)
);

dateInput.addEventListener("change", () => {
  if (!dateInput.value) dateInput.value = today;
  validateInputs();
});

transactionsContainer.addEventListener("click", (e) => {
  if (e.target.closest("button")) {
    const transactionElement = e.target.closest(".transaction");
    const transactionID = Number(transactionElement.dataset.id);
    transactionElement.remove();
    removeTransaction(transactionID);
  }
});

document.addEventListener("DOMContentLoaded", loadTransactions);

dateInput.value = today;
