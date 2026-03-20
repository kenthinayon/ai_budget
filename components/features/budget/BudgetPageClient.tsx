"use client";

import { useEffect, useMemo, useState } from "react";
import { PiggyBank, Plus, AlertTriangle, CheckCircle2, Flame, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AddBudgetDialog,
  EditBudgetDialog,
  type BudgetForEdit,
  type BudgetGroupType,
} from "./BudgetDialogs";
import {
  calc503020,
  calcPctUsed,
  clamp,
  formatCurrency,
  getBudgetStatus,
  type BudgetStatus,
} from "./budget-utils";

type BudgetRow = {
  id: string;
  category: string;
  limit_amount: number;
  group_type: "needs" | "wants" | "savings";
  spent_amount: number;
};

type BudgetSummaryResponse = {
  monthKey: string;
  incomeMonthly: number;
  totals: {
    needs: number;
    wants: number;
    savings: number;
  };
  budgets: BudgetRow[];
};

function statusStyles(status: BudgetStatus) {
  switch (status) {
    case "on-track":
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
        progress: "bg-emerald-500",
        icon: <CheckCircle2 className="h-4 w-4" />,
        label: "On track",
      };
    case "warning":
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
        progress: "bg-amber-500",
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "Warning",
      };
    case "critical":
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900",
        progress: "bg-rose-500",
        icon: <Flame className="h-4 w-4" />,
        label: "Critical",
      };
  }
}

export function BudgetPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BudgetSummaryResponse | null>(null);

  // dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetForEdit | null>(null);

  // form state
  const [incomeInput, setIncomeInput] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/budget/summary", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load budgets (${res.status})`);
      const json = (await res.json()) as BudgetSummaryResponse;
      setData(json);
      setIncomeInput(json.incomeMonthly ? String(json.incomeMonthly) : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    if (!data) return { needs: 0, wants: 0, savings: 0, total: 0 };
    const needs = data.totals.needs;
    const wants = data.totals.wants;
    const savings = data.totals.savings;
    return { needs, wants, savings, total: needs + wants + savings };
  }, [data]);

  const rule = useMemo(() => {
    if (!data) return null;
    return calc503020(data.incomeMonthly, totals.needs, totals.wants, totals.savings);
  }, [data, totals]);

  const recommendations = useMemo(() => {
    if (!rule || !data) return [] as string[];

    // Ideal allocations from income
    const idealNeeds = data.incomeMonthly * 0.5;
    const idealWants = data.incomeMonthly * 0.3;
    const idealSavings = data.incomeMonthly * 0.2;

    const msgs: string[] = [];

    // Basic sanity: over-allocating total budgets compared to income
    if (totals.total > data.incomeMonthly && data.incomeMonthly > 0) {
      msgs.push(
        `Your total budget allocations (${formatCurrency(totals.total)}) exceed your monthly income (${formatCurrency(data.incomeMonthly)}). Consider lowering category limits.`
      );
    }

    // Heuristic: flag if off by more than 5 percentage points
    const deltaNeeds = rule.needsPct - 50;
    const deltaWants = rule.wantsPct - 30;
    const deltaSavings = rule.savingsPct - 20;

    const abs = (n: number) => Math.abs(n);

    if (data.incomeMonthly > 0) {
      if (abs(deltaSavings) > 5) {
        if (deltaSavings < 0) {
          msgs.push(
            `Consider increasing Savings to reach ~20% of income (target ${formatCurrency(idealSavings)}).`
          );
        } else {
          msgs.push("You’re allocating more than 20% to Savings—nice! Just ensure your Needs are still covered.");
        }
      }

      if (abs(deltaNeeds) > 5) {
        if (deltaNeeds > 0) {
          msgs.push(
            `Needs are above 50%. Look for ways to reduce essential costs, or re-check which categories are marked as Needs.`
          );
        } else {
          msgs.push("Needs are below 50%. That can be great—make sure core bills are still covered.");
        }
      }

      if (abs(deltaWants) > 5) {
        if (deltaWants > 0) {
          msgs.push("Wants are above 30%. Consider trimming subscriptions, dining out, or impulse spending.");
        } else {
          msgs.push("Wants are below 30%. Great discipline—just keep your lifestyle sustainable.");
        }
      }
    }

    return msgs;
  }, [rule, data, totals]);

  async function saveIncome() {
    const income = Number(incomeInput);
    if (!Number.isFinite(income) || income < 0) {
      setError("Income must be a positive number.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyIncome: income }),
      });
      if (!res.ok) throw new Error(`Failed to save income (${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function createBudget(payload: { category: string; groupType: BudgetGroupType; limitAmount: number }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to add budget (${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function updateBudget(budgetId: string, limitAmount: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/budget/${budgetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limitAmount }),
      });
      if (!res.ok) throw new Error(`Failed to update budget (${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(budgetId: string) {
    const ok = window.confirm("Delete this budget category?");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/budget/${budgetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete budget (${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const headerValue = data?.incomeMonthly ? formatCurrency(data.incomeMonthly) : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-emerald-500" />
            Budget Management
          </h1>
          <p className="text-muted-foreground">
            Set limits and track spending by category.
          </p>
        </div>

        <Button onClick={() => setAddOpen(true)} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {error && (
        <Card className="border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/10">
          <CardContent className="py-4 text-rose-700 dark:text-rose-200">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Monthly Income */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Income</CardTitle>
          <p className="text-sm text-muted-foreground">Set your monthly income for budget planning.</p>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1">
            <Input
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              inputMode="numeric"
              placeholder="5000"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm font-semibold">
              {headerValue} / month
            </div>
            <Button variant="secondary" onClick={saveIncome} disabled={saving}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations 50/30/20 */}
      <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="text-amber-700 dark:text-amber-300">Budget Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading recommendations…</p>
          ) : recommendations.length ? (
            <ul className="list-disc pl-5 text-sm">
              {recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">
              Your allocations look reasonable. Keep an eye on categories that approach 70% usage.
            </p>
          )}

          {rule && (
            <div className="pt-3">
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="px-3 py-2 rounded-lg border bg-white/60 dark:bg-slate-950/40">
                  <div className="font-semibold">Needs</div>
                  <div className="text-muted-foreground">{rule.needsPct.toFixed(1)}%</div>
                </div>
                <div className="px-3 py-2 rounded-lg border bg-white/60 dark:bg-slate-950/40">
                  <div className="font-semibold">Wants</div>
                  <div className="text-muted-foreground">{rule.wantsPct.toFixed(1)}%</div>
                </div>
                <div className="px-3 py-2 rounded-lg border bg-white/60 dark:bg-slate-950/40">
                  <div className="font-semibold">Savings</div>
                  <div className="text-muted-foreground">{rule.savingsPct.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.incomeMonthly || 0)}</div>
            <p className="text-xs text-muted-foreground">Monthly available budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocated / Planned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(totals.total)}</div>
            <p className="text-xs text-muted-foreground">
              {data?.incomeMonthly ? `${calcPctUsed(totals.total, data.incomeMonthly).toFixed(1)}% of income allocated` : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remaining Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(Math.max(0, (data?.incomeMonthly || 0) - totals.total))}
            </div>
            <p className="text-xs text-muted-foreground">Left to allocate</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget cards */}
      <div className="space-y-8">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading budgets…</p>
        )}

        {!loading && data?.budgets?.length === 0 && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No budgets yet. Add a category above (e.g., Food & Groceries).
            </CardContent>
          </Card>
        )}

        {!loading && (["needs", "wants", "savings"] as const).map((groupType) => {
          const groupBudgets = (data?.budgets ?? []).filter((b) => b.group_type === groupType);
          if (groupBudgets.length === 0) return null;

          // Auto-calculate the allowed maximum for this group based on 50/30/20 rule
          const income = data?.incomeMonthly || 0;
          const ruleMultiplier = groupType === "needs" ? 0.5 : groupType === "wants" ? 0.3 : 0.2;
          const groupAllowedByRule = income * ruleMultiplier;

          // Total that has been assigned as "budget limit" to categories in this group
          const groupAllocated = groupBudgets.reduce((acc, b) => acc + b.limit_amount, 0);
          const groupSpentWithinAllocated = groupBudgets.reduce((acc, b) => acc + b.spent_amount, 0);

          // The user requested that adding budgets counts as "spent" against the total rule budget
          const rulePctUsed = calcPctUsed(groupAllocated, groupAllowedByRule);

          const title = groupType === "needs" ? "Needs (50%)" : groupType === "wants" ? "Wants (30%)" : "Savings (20%)";
          const desc = groupType === "needs" 
            ? "Tracks Bills, Food, Transport, Healthcare" 
            : groupType === "wants"
            ? "Tracks Entertainment, Shopping"
            : "Tracks your savings";

          return (
            <div key={groupType} className="space-y-4">
              <div className="flex flex-col gap-1 border-b pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
                  <div className="text-sm border rounded-lg px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-colors">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(groupAllocated)}</span>
                    <span className="text-muted-foreground ml-1">/ {formatCurrency(groupAllowedByRule)} allocated</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
                {groupAllowedByRule > 0 && (
                  <div className="space-y-1 mt-2">
                    <Progress 
                      value={clamp(rulePctUsed, 0, 100)} 
                      className="h-2" 
                      indicatorClassName={rulePctUsed > 100 ? "bg-rose-500" : "bg-emerald-500"} 
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground uppercase tracking-wider">
                      <span>{rulePctUsed.toFixed(1)}% full</span >
                      <span className={groupAllocated > groupAllowedByRule ? "text-rose-500 font-medium" : ""}>
                        {formatCurrency(Math.abs(groupAllowedByRule - groupAllocated))} {groupAllocated > groupAllowedByRule ? "over" : "remaining"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupBudgets.map((b) => {
                  const pctUsed = calcPctUsed(b.spent_amount, b.limit_amount);
                  const status = getBudgetStatus(pctUsed);
                  const styles = statusStyles(status);
                  const pctClamped = clamp(pctUsed, 0, 100);

                  return (
                    <Card key={b.id} className="overflow-hidden shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{b.category}</CardTitle>
                            <p className="text-xs text-muted-foreground capitalize">{b.group_type} · Monthly</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold ${styles.badge}`}>
                              {styles.icon}
                              {styles.label}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditBudget({
                                  id: b.id,
                                  category: b.category,
                                  group_type: b.group_type,
                                  limit_amount: b.limit_amount,
                                });
                                setEditOpen(true);
                              }}
                              aria-label={`Edit ${b.category}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                              onClick={() => void deleteBudget(b.id)}
                              aria-label={`Delete ${b.category}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <div className="text-sm text-muted-foreground">Spent</div>
                          <div className="text-sm font-semibold">
                            {formatCurrency(b.spent_amount)} / {formatCurrency(b.limit_amount)}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Progress value={pctClamped} className="h-1.5" indicatorClassName={styles.progress as never} />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{pctUsed.toFixed(1)}% used</span>
                            <span>{formatCurrency(Math.max(0, b.limit_amount - b.spent_amount))} left</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <AddBudgetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        saving={saving}
        onSubmit={createBudget}
      />

      <EditBudgetDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditBudget(null);
        }}
        saving={saving}
        budget={editBudget}
        onSubmit={updateBudget}
      />
    </div>
  );
}
