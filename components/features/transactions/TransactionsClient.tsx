"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, Download, Filter, Edit, Banknote } from "lucide-react";
import { formatCurrency } from "@/components/features/budget/budget-utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function TransactionsClient() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Dialog State
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchTransactions() {
    try {
      // Fetch both transactions and budget summary in parallel
      const [txRes, budgetRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/budget/summary")
      ]);
      const txData = await txRes.json();
      const budgetData = await budgetRes.json();
      
      if (!txRes.ok) throw new Error(txData.error);
      
      setTransactions(Array.isArray(txData) ? txData : []);
      
      // Extract unique user budget categories
      if (budgetRes.ok && budgetData.budgets) {
        const categories = budgetData.budgets.map((b: any) => b.category);
        setUserCategories(categories);
        // Default the selected category if empty
        if (!category && categories.length > 0) {
          setCategory(categories[0]);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount) return toast.error("Please fill in all fields.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          amount: Number(amount), 
          type, 
          category 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Transaction added!");
      setOpen(false);
      setTitle("");
      setAmount("");
      fetchTransactions();
    } catch (error: any) {
      toast.error("Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      
      toast.success("Transaction deleted");
      setTransactions((prev) => prev.filter(t => t.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const exportCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = filtered.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.title,
      t.category,
      t.type,
      t.amount
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" ? true : t.type === filterType;
    const matchesCategory = filterCategory === "all" ? true : t.category.toLowerCase() === filterCategory.toLowerCase();
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  // Summaries calculation (based on ALL transactions, or we can base it on FILTERED)
  // Let's base it on ALL transactions for Income/Expenses but the screenshot says "Filtered results", 
  // actually wait, let's just compute from 'filtered' array to make it perfectly match the "7 transaction(s) found" vibe.
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const incomeCount = transactions.filter(t => t.type === 'income').length;
  
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const expenseCount = transactions.filter(t => t.type === 'expense').length;
  
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction History</h1>
          <p className="text-muted-foreground mt-1">Track all your income and expenses.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportCSV} className="gap-2 bg-white">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={type === "expense" ? "default" : "outline"}
                      className={type === "expense" ? "bg-rose-500 hover:bg-rose-600 w-full text-white" : "w-full"}
                      onClick={() => {
                        setType("expense");
                        if (userCategories.length > 0) setCategory(userCategories[0]);
                      }}
                    >
                      <ArrowDownRight className="w-4 h-4 mr-2" /> Expense
                    </Button>
                    <Button
                      type="button"
                      variant={type === "income" ? "default" : "outline"}
                      className={type === "income" ? "bg-emerald-500 hover:bg-emerald-600 w-full text-white" : "w-full"}
                      onClick={() => {
                        setType("income");
                        setCategory("Income");
                      }}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" /> Income
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title / Description</Label>
                  <Input 
                    placeholder="e.g. Freelance, Grocery" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                  />
                </div>

                {type === "expense" ? (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {userCategories.length > 0 ? (
                          userCategories.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Needs">Needs (Housing, Food, Bills)</SelectItem>
                            <SelectItem value="Wants">Wants (Entertainment, Dining)</SelectItem>
                            <SelectItem value="Savings">Savings (Emergency, Investments)</SelectItem>
                          </>
                        )}
                        <SelectItem value="Other">Other Expenses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Income">Income (Salary)</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : null} Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-sm text-slate-500 mt-1">{incomeCount} transactions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-500">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-sm text-slate-500 mt-1">{expenseCount} transactions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${netBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {formatCurrency(netBalance)}
            </div>
            <p className="text-sm text-slate-500 mt-1">Filtered results</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Input 
                  placeholder="Search transactions..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/50">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/50">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {userCategories.map((c: any) => (
                    <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200/60 dark:border-slate-800 overflow-hidden">
        <CardHeader className="pb-4 border-b bg-white dark:bg-slate-950">
          <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
          <CardDescription>{filtered.length} transaction(s) found</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12"><Spinner className="w-8 h-8 text-emerald-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
              No transactions match your filters.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t bg-white dark:bg-slate-950">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(tx.date).toLocaleDateString(undefined, { 
                        month: 'numeric', day: 'numeric', year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {tx.title}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Banknote className="w-4 h-4 text-emerald-500" />
                        {tx.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.type === 'income' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Income
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Expense
                        </div>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(tx.id)} 
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}