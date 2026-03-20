"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { LogOut, Settings, Camera, Save, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { logout } from "@/actions/auth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarUserProps {
  user: User | null;
}

export function SidebarUser({ user }: SidebarUserProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const email = user?.email || "demo@budgetwise.ai";
  // The full_name might be in user_metadata, otherwise we fallback
  const fullName = user?.user_metadata?.full_name || "Demo User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Generate initials
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // In a real app we'd call a server action here to update Supabase 'user_metadata'
    // e.g. await updateProfile(formData)
    setTimeout(() => {
      setIsSaving(false);
      setIsDialogOpen(false);
      toast.success("Profile updated successfully!");
    }, 1000);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button suppressHydrationWarning className="flex w-full items-center gap-3 rounded-2xl bg-blue-50/50 p-2 py-2.5 px-3 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-left cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <Avatar className="h-10 w-10 border border-emerald-100 dark:border-emerald-900 shadow-sm">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-emerald-500 text-white font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {fullName}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {email}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={14}>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* We wrap the trigger in a normal menu item styling so it works within DropdownMenu */}
          <DialogTrigger asChild>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Settings className="h-4 w-4 text-slate-500" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
          </DialogTrigger>

          <DropdownMenuSeparator />
          
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm text-slate-700 dark:text-slate-300">Appearance</span>
            <ThemeToggle />
          </div>

          <DropdownMenuSeparator />

          <form action={logout}>
            <button type="submit" className="w-full">
              <DropdownMenuItem className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/50">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Edit Modal */}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSaveProfile}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Avatar Upload UI */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-emerald-500 shadow-sm">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="bg-emerald-500 text-white text-xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button type="button" className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-900 text-white shadow-sm hover:bg-slate-700 transition">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-slate-500">Allowed: JPG, PNG (Max 2MB)</span>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="name" 
                    defaultValue={fullName} 
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email-settings">Email Address</Label>
                <Input 
                  id="email-settings" 
                  defaultValue={email} 
                  disabled
                  className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Email address cannot be changed directly here.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password"
                  placeholder="Leave blank to keep current" 
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
