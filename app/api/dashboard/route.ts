import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mk = monthKey();

  const { data: budgetsRow } = await supabase.from("budgets").select("id, category, limit_amount, group_type").eq("user_id", user.id).eq("month", mk);
  const budgets = budgetsRow ?? [];

  const { data: currentMonthTxs } = await supabase.from("transactions").select("id, title, amount, type, category, date").eq("user_id", user.id).eq("month", mk).order("date", { ascending: false });

  let incomeMonthly = 0;
  let currentSpent = 0;
  const categorySpent: Record<string, number> = {};
  const categoryToGroup: Record<string, string> = {};

  budgets.forEach(b => { categoryToGroup[b.category] = b.group_type; });

  const groupLimits = { needs: 0, wants: 0, savings: 0 };
  const groupSpent = { needs: 0, wants: 0, savings: 0 };

  if (currentMonthTxs) {
    for (const tx of currentMonthTxs) {
      if (tx.type === "income") {
        incomeMonthly += Number(tx.amount);
      } else if (tx.type === "expense") {
        currentSpent += Number(tx.amount);
        categorySpent[tx.category] = (categorySpent[tx.category] || 0) + Number(tx.amount);

        const group = categoryToGroup[tx.category] || "needs";
        if (group in groupSpent) {
           groupSpent[group as keyof typeof groupSpent] += Number(tx.amount);
        }
      }
    }
  }

  // Calculate limits based on dynamic income
  groupLimits.needs = incomeMonthly * 0.5;
  groupLimits.wants = incomeMonthly * 0.3;
  groupLimits.savings = incomeMonthly * 0.2;

  const individualBudgets = budgets.map(b => {
     const spent = categorySpent[b.category] || 0;
     const limit = Number(b.limit_amount);
     const pct = limit > 0 ? (spent / limit) * 100 : 0;
     return { category: b.category, limit, spent, pct };
  });

  const pieChartData = Object.entries(categorySpent).map(([name, value], index) => {
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];
    return { name, value, fill: colors[index % colors.length] };
  });

  return NextResponse.json({
    incomeMonthly,
    currentSpent,
    netBalance: incomeMonthly - currentSpent,
    groupLimits,
    groupSpent,
    individualBudgets,
    pieChartData,
    hasTransactions: currentMonthTxs && currentMonthTxs.length > 0
  });
}