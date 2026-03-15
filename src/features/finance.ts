import type { ExpenseEntry, SavingsGoal } from '../types';

export const EXPENSE_CATEGORIES = ['Gıda','Ulaşım','Fatura','Eğlence','Sağlık','Eğitim','Diğer'] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const createExpense = (payload:{title:string; amount:number; category:ExpenseCategory}): ExpenseEntry => ({
  id:`exp_${Date.now()}`,
  title:payload.title.trim(),
  amount:Math.max(0, Number(payload.amount) || 0),
  category:payload.category,
  createdAt:new Date().toISOString(),
});

export const createSavingsGoal = (payload:{title:string; target:number; current?:number}): SavingsGoal => ({
  id:`goal_${Date.now()}`,
  title:payload.title.trim(),
  target:Math.max(1, Number(payload.target) || 1),
  current:Math.max(0, Number(payload.current) || 0),
  createdAt:new Date().toISOString(),
});

export const summarizeExpenses = (expenses:ExpenseEntry[]) => {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.map(category => ({
    category,
    total: expenses.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0),
  })).filter(item => item.total > 0);
  const topCategory = byCategory.sort((a,b)=>b.total-a.total)[0] ?? null;
  return { total, byCategory, topCategory };
};

export const getGoalProgress = (goal:SavingsGoal) => {
  const percent = Math.max(0, Math.min(100, Math.round((goal.current / Math.max(goal.target,1))*100)));
  return {
    percent,
    remaining: Math.max(0, goal.target - goal.current),
    completed: goal.current >= goal.target,
  };
};

export const getRecentExpenseAverage = (expenses:ExpenseEntry[], days = 7) => {
  if (days <= 0) return 0;
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = expenses.filter(item => {
    const ts = new Date(item.createdAt).getTime();
    return Number.isFinite(ts) && ts >= threshold;
  });
  if (!recent.length) return 0;
  return recent.reduce((sum, item) => sum + item.amount, 0) / days;
};


export const isSameMonth = (iso:string, reference = new Date()) => {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) && date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
};

export const getMonthlyExpenseTotal = (expenses:ExpenseEntry[], reference = new Date()) => (
  expenses.filter(item => isSameMonth(item.createdAt, reference)).reduce((sum, item) => sum + item.amount, 0)
);

export const getCategoryDistribution = (expenses:ExpenseEntry[]) => {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) return [];
  return EXPENSE_CATEGORIES.map(category => {
    const amount = expenses.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0);
    return { category, amount, percent: Math.round((amount / total) * 100) };
  }).filter(item => item.amount > 0).sort((a,b) => b.amount - a.amount);
};
