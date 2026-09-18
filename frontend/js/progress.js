/**
 * NEXORA - Progress & Productivity Overview JavaScript
 * Calculates and visualizes completion metrics, subject breakdowns, and productivity stats.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadProgressData();
});

async function loadProgressData() {
  const data = await fetchAPI('/api/progress/summary');
  if (!data || !data.success) return;

  const tasks = data.tasks || {};
  const assignments = data.assignments || {};
  const expenses = data.expenses || {};

  // 1. Task Completion
  document.getElementById('progressTaskTotal').textContent = tasks.total || 0;
  document.getElementById('progressTaskDone').textContent = tasks.completed || 0;
  document.getElementById('progressTaskPending').textContent = tasks.pending || 0;
  
  const taskCircle = document.getElementById('taskProgressCircle');
  const taskPct = tasks.percentage || 0;
  if (taskCircle) {
    taskCircle.style.setProperty('--percent', taskPct);
    taskCircle.querySelector('span').textContent = `${taskPct}%`;
  }

  // 2. Assignment Completion
  document.getElementById('progressAssignTotal').textContent = assignments.total || 0;
  document.getElementById('progressAssignDone').textContent = assignments.completed || 0;
  document.getElementById('progressAssignPending').textContent = assignments.pending || 0;

  const assignCircle = document.getElementById('assignProgressCircle');
  const assignPct = assignments.percentage || 0;
  if (assignCircle) {
    assignCircle.style.setProperty('--percent', assignPct);
    assignCircle.querySelector('span').textContent = `${assignPct}%`;
  }

  // 3. Subject-wise Assignment Breakdown
  const subjectContainer = document.getElementById('subjectProgressContainer');
  if (subjectContainer) {
    const subjects = assignments.by_subject || [];
    if (subjects.length === 0) {
      subjectContainer.innerHTML = `<p style="color: var(--text-dim); font-size: 0.88rem;">No assignment data by subject.</p>`;
    } else {
      subjectContainer.innerHTML = subjects.map(s => `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 700; margin-bottom: 6px;">
            <span>${escapeHTML(s.subject)}</span>
            <span>${s.completed}/${s.total} Completed (${s.rate}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${s.rate}%; background-color: var(--primary);"></div>
          </div>
        </div>
      `).join('');
    }
  }

  // 4. Monthly Expense Distribution
  const expenseContainer = document.getElementById('expenseProgressContainer');
  if (expenseContainer) {
    const categories = expenses.categories || [];
    const totalExp = expenses.total || 0;

    if (categories.length === 0) {
      expenseContainer.innerHTML = `<p style="color: var(--text-dim); font-size: 0.88rem;">No expense activity recorded this month.</p>`;
    } else {
      expenseContainer.innerHTML = categories.map(c => {
        const pct = totalExp > 0 ? ((c.total / totalExp) * 100).toFixed(1) : 0;
        const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(c.total);
        return `
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px;">
              <span>${c.category}</span>
              <span>${formattedTotal} (${pct}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${c.category}" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}
