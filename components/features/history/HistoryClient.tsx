"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/components/features/budget/budget-utils";
import { History, ArrowUpRight, ArrowDownRight, Clock, Search, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function HistoryClient() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          // Sort by date descending
          const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(sorted);
        }
      } catch (error) {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <History className="h-8 w-8 text-emerald-500" />
          Activity Log
        </h1>
        <p className="text-muted-foreground mt-1">A timeline of all your budget history and financial transactions.</p>
      </div>

      <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
        <CardHeader className="pb-4 border-b bg-white dark:bg-slate-950 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>{filtered.length} recent activities found</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
              className="pl-8 bg-slate-50/50 dark:bg-slate-900/50" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center p-12"><Spinner className="w-8 h-8 text-emerald-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Clock className="h-10 w-10 opacity-20" />
              <p>No historical logs found.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 pb-4 space-y-8">
              {filtered.map((tx, idx) => (
                <div key={tx.id || idx} className="relative pl-8">
                  {/* Timeline dot */}
                  <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white dark:ring-slate-950 ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </span>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <Badge variant="outline" className="text-[10px] font-medium px-2 py-0">
                          <Banknote className="w-3 h-3 mr-1" />
                          {tx.category}
                        </Badge>
                        <time className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(tx.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </time>
                      </div>
                      
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {tx.type === 'income' ? 'Received income from ' : 'Spent money on '}
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {tx.title}
                        </span>
                      </p>
                    </div>

                    <div className={`text-lg font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}