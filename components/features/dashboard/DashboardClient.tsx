"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, DollarSign, Target, PieChart, Activity, AlertCircle, AlertTriangle, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, calcPctUsed } from "@/components/features/budget/budget-utils";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";

export function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    incomeMonthly,
    currentSpent,
    netBalance,
    groupLimits,
    groupSpent,
    individualBudgets,
    pieChartData,
    hasTransactions
  } = data;

  const totalExpensesPct = incomeMonthly > 0 ? (currentSpent / incomeMonthly) * 100 : 0;
  
  // Find budgets where pct > 85%
  const warnings = individualBudgets.filter((b: any) => b.pct >= 85);

  const formatPct = (val: number) => (isNaN(val) || !isFinite(val) ? 0 : val).toFixed(1);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
        <p className="text-muted-foreground">AI-powered insights and budget tracking</p>
      </div>

      {warnings.length > 0 && (
        <Alert className="border-amber-500 bg-amber-50/50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">Budget Warning</AlertTitle>
          <AlertDescription>
            {warnings.map((w: any, idx: number) => (
              <div key={idx}>Warning: You've spent {formatPct(w.pct)}% of your {w.category} budget.</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(incomeMonthly)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{formatCurrency(currentSpent)}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatPct(totalExpensesPct)}% of income</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(netBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Positive balance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-emerald-100 dark:border-emerald-900">
        <CardHeader className="pb-3 border-b border-emerald-50 dark:border-emerald-900/30">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            <CardTitle>50/30/20 Budget Rule</CardTitle>
          </div>
          <CardDescription>Allocate 50% to needs, 30% to wants, and 20% to savings</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {[
            { 
              label: "Needs (50%)", 
              desc: "Bills, food, transport, healthcare", 
              spent: groupSpent.needs, limit: groupLimits.needs,
              color: "bg-emerald-500" 
            },
            { 
              label: "Wants (30%)", 
              desc: "Entertainment, shopping", 
              spent: groupSpent.wants, limit: groupLimits.wants,
              color: "bg-emerald-400" 
            },
            { 
              label: "Savings (20%)", 
              desc: "Investing, emergency fund", 
              spent: groupSpent.savings, limit: groupLimits.savings,
              color: "bg-emerald-300"
            }
          ].map((item, idx) => {
            const pct = item.limit > 0 ? (item.spent / item.limit) * 100 : 0;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(item.spent)} / {formatCurrency(item.limit)}</div>
                    <div className="text-xs text-muted-foreground">{formatPct(pct)}%</div>
                  </div>
                </div>
                <div className="h-3 w-full bg-emerald-50 dark:bg-emerald-950/30 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Current month breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            {pieChartData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No expenses yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
            <CardDescription>Category utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {individualBudgets.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No budgets created yet.</p>
              ) : (
                individualBudgets.map((b: any, idx: number) => {
                  const isOver = b.pct >= 100;
                  const isWarning = b.pct >= 85 && !isOver;
                  
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{b.category}</span>
                        <span className="font-semibold text-muted-foreground">
                          {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}`} 
                          style={{ width: `${Math.min(100, b.pct)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10">
        <CardHeader className="pb-3 border-b border-indigo-100/50 dark:border-indigo-900/30">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
            <CardTitle>AI Financial Insights</CardTitle>
          </div>
          <CardDescription>Personalized recommendations based on your spending</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Positive Balance</h4>
              <p className="text-xs text-muted-foreground mt-1">Great job! You're maintaining a positive balance of {formatCurrency(netBalance)} this month.</p>
            </div>
            <div className="text-[10px] font-medium px-2 py-1 bg-secondary rounded-md text-muted-foreground">low</div>
          </div>
          
          {(groupSpent.savings === 0) && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm border-rose-100 dark:border-rose-900">
              <div className="p-2 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <Target className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Increase Savings</h4>
                <p className="text-xs text-muted-foreground mt-1">You're only saving 0.0% of your goal. Try to automate savings or reduce unnecessary expenses.</p>
              </div>
              <div className="text-[10px] font-medium px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-400 rounded-md">high</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}