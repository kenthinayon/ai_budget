/**
 * ==========================================
 * DASHBOARD HOMEPAGE (app/(dashboard)/page.tsx)
 * IDENTIFIER: Main Dashboard View (URL: "/")
 * PURPOSE: The first screen users see after logging in. Contains metric widgets.
 * ==========================================
 */
import { DashboardClient } from "@/components/features/dashboard/DashboardClient";

export default function Home() {
  return <DashboardClient />;
}
