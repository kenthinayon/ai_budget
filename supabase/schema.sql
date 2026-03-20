-- BudgetWise schema (minimal) for budgets + transactions + monthly income
-- Run this in Supabase SQL editor.

-- 1) Monthly income per user
create table if not exists public.incomes (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null, -- format YYYY-MM
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

-- 2) Budgets per category per month
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null, -- format YYYY-MM
  category text not null,
  group_type text not null check (group_type in ('needs','wants','savings')),
  limit_amount numeric not null check (limit_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category)
);

-- 3) Transactions (expenses) per month
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null, -- format YYYY-MM
  occurred_on date not null default current_date,
  category text not null,
  description text,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.incomes enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;

-- RLS: users can only access their rows
create policy "incomes_select_own" on public.incomes
for select using (auth.uid() = user_id);
create policy "incomes_modify_own" on public.incomes
for insert with check (auth.uid() = user_id);
create policy "incomes_update_own" on public.incomes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets_select_own" on public.budgets
for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets
for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets
for delete using (auth.uid() = user_id);

create policy "transactions_select_own" on public.transactions
for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
for insert with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
for delete using (auth.uid() = user_id);

-- Helpful indexes
create index if not exists idx_budgets_user_month on public.budgets(user_id, month);
create index if not exists idx_transactions_user_month on public.transactions(user_id, month);
create index if not exists idx_transactions_user_month_category on public.transactions(user_id, month, category);
