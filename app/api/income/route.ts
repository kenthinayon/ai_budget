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
  const monthlyIncome = Number(body?.monthlyIncome);

  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
    return NextResponse.json({ error: "monthlyIncome must be a number >= 0" }, { status: 400 });
  }

  const mk = monthKey();

  // Upsert monthly income row
  const { error } = await supabase
    .from("incomes")
    .upsert(
      {
        user_id: user.id,
        month: mk,
        amount: monthlyIncome,
      },
      { onConflict: "user_id,month" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
