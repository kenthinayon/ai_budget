import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);
  const category = String(body?.category ?? "").trim();
  const groupType = body?.groupType as "needs" | "wants" | "savings";
  const limitAmount = Number(body?.limitAmount);

  if (!category) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }
  if (!groupType || !["needs", "wants", "savings"].includes(groupType)) {
    return NextResponse.json({ error: "groupType must be needs | wants | savings" }, { status: 400 });
  }
  if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
    return NextResponse.json({ error: "limitAmount must be > 0" }, { status: 400 });
  }

  const mk = monthKey();

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      month: mk,
      category,
      group_type: groupType,
      limit_amount: limitAmount,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
