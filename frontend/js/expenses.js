/**
 * NEXORA - Expense Tracker JavaScript
 * Manages personal student expenses, category breakdowns, and monthly summaries.
 */

let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
let editingExpenseId = null;

document.addEventListener('DOMContentLoaded', () => {
  initMonthSelector();
  loadExpenses();
  initExpenseForm();
});

function initMonthSelector() {
  const monthInput = document.getElementById('expenseMonthFilter');
  if (monthInput) {
    monthInput.value = currentMonth;
    monthInput.addEventListener('change', (e) => {
      currentMonth = e.target.value;
      loadExpenses();
    });
  }
}

async function loadExpenses() {
  const tableBody = document.getElementById('expensesTableBody');
  const summaryBox = document.getElementById('categorySummaryContainer');
  const totalDisplay = document.getElementById('expenseMonthTotal');

  if (!tableBody) return;

  const url = `/api/expenses?month=${currentMonth}`;
  const data = await fetchAPI(url);

  if (!data || !data.success) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-description" style="text-align: center;">Failed to load expenses.</td></tr>`;
    return;
  }

  const expenses = data.expenses || [];
  const total = data.total_amount || 0;
  const catSummary = data.category_summary || [];

  // Update total
  if (totalDisplay) {
    totalDisplay.textContent = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(total);
  }

  // Render category breakdown bars
  if (summaryBox) {
    if (catSummary.length === 0) {
      summaryBox.innerHTML = `<p style="color: var(--text-dim); font-size: 0.85rem;">No spending recorded for this month.</p>`;
    } else {
      summaryBox.innerHTML = catSummary.map(c => {
        const pct = total > 0 ? ((c.total / total) * 100).toFixed(1) : 0;
        const formattedCatTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(c.total);
        return `
          <div class="category-bar-item">
            <div class="category-bar-header">
              <span>${c.category} (${c.count})</span>
              <span>${formattedCatTotal} <small style="color: var(--text-dim);">(${pct}%)</small></span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${c.category}" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render expenses list
  if (expenses.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 30px;">
          <div class="empty-state" style="padding: 0;">
            <p class="empty-description" style="margin-bottom: 0;">No expenses found for this month.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = expenses.map(exp => {
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(exp.amount);
    return `
      <tr id="expense-${exp.id}">
        <td><strong>${exp.expense_date_str}</strong></td>
        <td><span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary-light);">${exp.category}</span></td>
        <td>${escapeHTML(exp.description || '-')}</td>
        <td class="amount-text">${formattedAmount}</td>
        <td style="text-align: right;">
          <button class="btn btn-ghost btn-sm" onclick='openEditExpenseModal(${JSON.stringify(exp)})' title="Edit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="deleteExpense(${exp.id})" title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function initExpenseForm() {
  const form = document.getElementById('expenseForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = document.getElementById('expCategory').value;
    const amount = document.getElementById('expAmount').value;
    const expense_date = document.getElementById('expDate').value;
    const description = document.getElementById('expDescription').value.trim();

    if (!category || !amount || !expense_date) {
      showToast('Please fill in category, amount, and date.', 'error');
      return;
    }

    let res;
    if (editingExpenseId) {
      res = await fetchAPI(`/api/expenses/${editingExpenseId}`, {
        method: 'PUT',
        body: JSON.stringify({ category, amount, expense_date, description })
      });
    } else {
      res = await fetchAPI('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ category, amount, expense_date, description })
      });
    }

    if (res && res.success) {
      showToast(res.message, 'success');
      closeModal('expenseModal');
      form.reset();
      editingExpenseId = null;
      loadExpenses();
    } else if (res) {
      showToast(res.message || 'Failed to record expense.', 'error');
    }
  });
}

function openAddExpenseModal() {
  editingExpenseId = null;
  const form = document.getElementById('expenseForm');
  if (form) form.reset();

  // Set default date to today
  const dateInput = document.getElementById('expDate');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  const titleEl = document.getElementById('expModalTitle');
  if (titleEl) titleEl.textContent = 'Add Expense';

  openModal('expenseModal');
}

function openEditExpenseModal(exp) {
  editingExpenseId = exp.id;

  document.getElementById('expCategory').value = exp.category || 'Other';
  document.getElementById('expAmount').value = exp.amount || '';
  document.getElementById('expDate').value = exp.expense_date_str || '';
  document.getElementById('expDescription').value = exp.description || '';

  const titleEl = document.getElementById('expModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Expense';

  openModal('expenseModal');
}

async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense record?')) return;

  const res = await fetchAPI(`/api/expenses/${id}`, { method: 'DELETE' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadExpenses();
  }
}
