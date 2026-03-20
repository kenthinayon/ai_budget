import { TransactionsClient } from "@/components/features/transactions/TransactionsClient";

export const metadata = {
  title: "Transactions",
  description: "Manage your income and expenses",
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}