"use client";

import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, MessageSquare, PiggyBank, History, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarUser } from "@/components/layout/sidebar-user";

// Menu items reflecting the new design
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "AI Chat",
    url: "/ai-chat",
    icon: MessageSquare,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: Receipt,
  },
  {
    title: "Budget",
    url: "/budget",
    icon: PiggyBank,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
];

interface AppSidebarProps {
  user?: User | null;
}

export function AppSidebar({ user = null }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      {/* Header with Logo */}
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-emerald-500">
            <PiggyBank className="h-8 w-8" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-slate-900 dark:text-white leading-tight">
              BudgetWise AI
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Smart Budgeting
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent className="px-4 mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "h-12 px-4 rounded-xl transition-all duration-200 group flex items-center gap-3 text-base font-medium",
                        isActive
                          ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white"
                          : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-emerald-400"
                      )}
                    >
                      <a href={item.url}>
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                          )}
                        />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Profile Section */}
      <SidebarFooter className="p-4 mt-auto">
        <SidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
