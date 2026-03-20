import { createClient } from "@/lib/supabase/server";
import { BudgetPageClient } from "@/components/features/budget/BudgetPageClient";

export const metadata = {
  title: "Budget | BudgetWise",
};

export default async function BudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If middleware works, user should exist here. But keep it defensive.
  if (!user) {
    return (
      <div className="py-10">
        <h1 className="text-2xl font-bold">Budget</h1>
        <p className="text-muted-foreground mt-2">Please log in to view your budgets.</p>
      </div>
    );
  }

  return <BudgetPageClient />;
}
