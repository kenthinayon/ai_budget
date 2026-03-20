/**
 * ==========================================
 * DASHBOARD LAYOUT (app/(dashboard)/layout.tsx)
 * IDENTIFIER: Authenticated App Wrapper
 * PURPOSE: Wraps only the secure pages (Dashboard, Budget, etc.) with the Sidebar UI.
 * ==========================================
 */
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="w-full min-h-screen relative bg-slate-50/50 dark:bg-slate-950">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white dark:bg-slate-950">
          <SidebarTrigger className="text-slate-500 hover:text-emerald-600" />
        </header>
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}