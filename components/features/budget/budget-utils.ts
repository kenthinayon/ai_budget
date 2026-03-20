export type BudgetStatus = "on-track" | "warning" | "critical";

export function getBudgetStatus(pctUsed: number): BudgetStatus {
  if (pctUsed < 70) return "on-track";
  if (pctUsed <= 90) return "warning";
  return "critical";
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatCurrency(amount: number, currency = "PHP") {
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₱${Math.round(amount).toLocaleString()}`;
  }
}

export function calcPctUsed(spent: number, limit: number) {
  if (!limit || limit <= 0) return 0;
  return (spent / limit) * 100;
}

export type BudgetRuleBreakdown = {
  needs: number;
  wants: number;
  savings: number;
  total: number;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
};

export function calc503020(incomeMonthly: number, needs: number, wants: number, savings: number): BudgetRuleBreakdown {
  const total = needs + wants + savings;
  const denom = incomeMonthly > 0 ? incomeMonthly : total > 0 ? total : 1;
  const needsPct = (needs / denom) * 100;
  const wantsPct = (wants / denom) * 100;
  const savingsPct = (savings / denom) * 100;

  return {
    needs,
    wants,
    savings,
    total,
    needsPct,
    wantsPct,
    savingsPct,
  };
}
