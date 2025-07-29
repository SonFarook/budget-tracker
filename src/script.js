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
  } else if (!descriptionInput.value) {
    displayError("Please enter a description.");
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

const toggleTextColor = (value, element) => {
  if (value > 0) {
    element.classList.add("text-green-500");
    element.classList.remove("text-red-500");
  } else if (value < 0) {
    element.classList.add("text-red-500");
    element.classList.remove("text-green-500");
  } else {
    element.classList.remove("text-red-500");
    element.classList.remove("text-green-500");
  }
  console.log(value);
};

const updateTotalsUI = () => {
  balanceDisplay.textContent = formatCurrency(totalBalance);
  spendingDisplay.textContent = formatCurrency(totalSpending);
  revenueDisplay.textContent = formatCurrency(totalRevenue);

  toggleTextColor(totalBalance, balanceDisplay);
  toggleTextColor(totalSpending, spendingDisplay);
  toggleTextColor(totalRevenue, revenueDisplay);
};

const renderTransaction = (transaction) => {
  const html = `
        <div data-id="${transaction.id}" class="transaction flex gap-4 justify-center items-center mx-8 last:mb-8">
          <div class="border border-white rounded-2xl flex justify-between items-center min-w-[320px]">
            <div class="flex flex-col ml-3">
              <p class="text-lg">${transaction.description}</p>
              <p class="font-bold text-sm -mt-2">${transaction.date}</p>
            </div>
            <p class="ml-24 mr-1 ${transaction.type === "revenue" ? "text-green-500" : "text-red-500"}">${transaction.type === "revenue" ? "+" : "-"}${transaction.amount} €</p>
          </div>
          <button>
            <img src="img/delete.png" alt="Delete Transaction" class="w-6 h-6 hover:cursor-pointer hover:opacity-90 active:opacity-80">
          </button>
        </div>
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
      const amount = parseFloat(transaction.amount.replace(",", "."));

      if (transaction.type === "spending") {
        totalBalance -= Number(amount);
        totalSpending -= Number(amount);
      } else {
        totalBalance += Number(amount);
        totalRevenue += Number(amount);
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

descriptionInput.addEventListener("input", validateInputs);

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
