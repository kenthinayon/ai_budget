import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mk = monthKey();

  // 1) income
  const { data: incomeRow, error: incomeErr } = await supabase
    .from("incomes")
    .select("amount")
    .eq("user_id", user.id)
    .eq("month", mk)
    .maybeSingle();

  if (incomeErr) {
    return NextResponse.json({ error: incomeErr.message }, { status: 500 });
  }

  const incomeMonthly = Number(incomeRow?.amount ?? 0);

  // 2) budgets
  const { data: budgets, error: budgetsErr } = await supabase
    .from("budgets")
    .select("id, category, limit_amount, group_type")
    .eq("user_id", user.id)
    .eq("month", mk)
    .order("category", { ascending: true });

  if (budgetsErr) {
    return NextResponse.json({ error: budgetsErr.message }, { status: 500 });
  }

  // 3) compute spent per budget by summing transactions mapped to that category
  // If you later add a full category table, we can join on category_id instead.
  const { data: txs, error: txErr } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", user.id)
    .eq("month", mk);

  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  const spentByCategory = new Map<string, number>();
  for (const t of txs ?? []) {
    const cat = String((t as any).category ?? "");
    const amt = Number((t as any).amount ?? 0);
    spentByCategory.set(cat, (spentByCategory.get(cat) ?? 0) + amt);
  }

  const budgetsWithSpent = (budgets ?? []).map((b: any) => {
    const category = String(b.category);
    return {
      id: String(b.id),
      category,
      limit_amount: Number(b.limit_amount ?? 0),
      group_type: b.group_type as "needs" | "wants" | "savings",
      spent_amount: Number(spentByCategory.get(category) ?? 0),
    };
  });

  // totals by group for 50/30/20 validation
  const totals = budgetsWithSpent.reduce(
    (acc, b) => {
      acc[b.group_type] += b.limit_amount;
      return acc;
    },
    { needs: 0, wants: 0, savings: 0 }
  );

  return NextResponse.json({
    monthKey: mk,
    incomeMonthly,
    totals,
    budgets: budgetsWithSpent,
  });
}
