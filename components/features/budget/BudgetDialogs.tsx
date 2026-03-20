"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BudgetGroupType = "needs" | "wants" | "savings";

export type BudgetForEdit = {
  id: string;
  category: string;
  limit_amount: number;
  group_type: BudgetGroupType;
};

const CATEGORY_PRESETS = [
  "Food & Groceries",
  "Transportation",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Savings",
];

type BudgetUpsertPayload = {
  category: string;
  groupType: BudgetGroupType;
  limitAmount: number;
};

type AddBudgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSubmit: (payload: BudgetUpsertPayload) => Promise<void>;
};

export function AddBudgetDialog({ open, onOpenChange, saving, onSubmit }: AddBudgetDialogProps) {
  const [category, setCategory] = useState("");
  const [groupType, setGroupType] = useState<BudgetGroupType>("needs");
  const [limitAmount, setLimitAmount] = useState<string>("");

  const canSubmit = useMemo(() => {
    const limit = Number(limitAmount);
    return category.trim().length > 0 && Number.isFinite(limit) && limit > 0;
  }, [category, limitAmount]);

  useEffect(() => {
    if (!open) {
      setCategory("");
      setGroupType("needs");
      setLimitAmount("");
    }
  }, [open]);

  async function submit() {
    if (!canSubmit) return;
    await onSubmit({
      category: category.trim(),
      groupType,
      limitAmount: Number(limitAmount),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Budget</DialogTitle>
          <DialogDescription>Create a spending limit for a category.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Category</label>
            <input
              className="h-10 rounded-md border bg-transparent px-3 text-sm"
              list="budget-category-presets"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Food & Groceries"
            />
            <datalist id="budget-category-presets">
              {CATEGORY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Group</label>
            <select
              className="h-10 rounded-md border bg-transparent px-3 text-sm"
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as BudgetGroupType)}
            >
              <option value="needs">Needs</option>
              <option value="wants">Wants</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Budget Limit</label>
            <Input
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              inputMode="numeric"
              placeholder="500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !canSubmit} className="bg-emerald-500 hover:bg-emerald-600">
            Add Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EditBudgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  budget: BudgetForEdit | null;
  onSubmit: (budgetId: string, limitAmount: number) => Promise<void>;
};

export function EditBudgetDialog({ open, onOpenChange, saving, budget, onSubmit }: EditBudgetDialogProps) {
  const [limitAmount, setLimitAmount] = useState<string>("");

  useEffect(() => {
    if (open && budget) {
      setLimitAmount(String(budget.limit_amount ?? ""));
    }
  }, [open, budget]);

  const canSubmit = useMemo(() => {
    const limit = Number(limitAmount);
    return !!budget && Number.isFinite(limit) && limit > 0;
  }, [limitAmount, budget]);

  async function submit() {
    if (!budget || !canSubmit) return;
    await onSubmit(budget.id, Number(limitAmount));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update spending limit for this category.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1">
            <div className="text-sm font-medium">Category</div>
            <div className="text-sm text-muted-foreground">{budget?.category ?? ""}</div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Budget Limit</label>
            <Input
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              inputMode="numeric"
              placeholder="400"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !canSubmit} className="bg-emerald-500 hover:bg-emerald-600">
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
