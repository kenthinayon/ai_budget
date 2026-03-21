"use client";

import { useTransition } from "react";
import { PiggyBank, Mail, Lock, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login, signup } from "@/actions/auth";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export function AuthForm() {
  const [isPending, startTransition] = useTransition();

  async function handleLogin(formData: FormData) {
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        toast.error("Login Failed", { description: result.error });
      } else {
        toast.success("Welcome back!");
      }
    });
  }

  async function handleSignup(formData: FormData) {
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) {
        toast.error("Registration Failed", { description: result.error });
      } else {
        toast.success("Account created successfully!");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 relative overflow-hidden dark:from-slate-950 dark:to-slate-900 w-full to-emerald-50/50 p-4">
      {/* Decorative background shapes for a catchy look */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Header/Logo Section */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 transform transition hover:scale-105">
            <PiggyBank className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome to BudgetWise AI
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-1.5 dark:text-slate-400">
            Smart budgeting powered by artificial intelligence
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </p>
        </div>

        {/* Auth Card using Tabs for Login/Signup */}
        <Card className="w-full border-slate-200/60 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none backdrop-blur-sm rounded-2xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-t-2xl rounded-b-none border-b border-slate-200 dark:border-slate-800">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-slate-950 rounded-xl transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-slate-950 rounded-xl transition-all"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="p-0 m-0">
              <form action={handleLogin}>
                <CardHeader>
                  <CardTitle className="text-xl">Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        id="email-login" 
                        name="email"
                        placeholder="you@example.com" 
                        type="email"
                        required
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 dark:bg-slate-900/50 dark:border-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-login">Password</Label>
                      <a href="#" className="text-xs font-medium text-emerald-600 hover:text-emerald-500">
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        id="password-login" 
                        name="password"
                        placeholder="••••••••" 
                        type="password"
                        required
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 dark:bg-slate-900/50 dark:border-slate-800"
                      />
                    </div>
                  </div>
                  <Button 
                    disabled={isPending}
                    type="submit"
                    className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors shadow-md shadow-emerald-500/20 mt-2"
                  >
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="p-0 m-0">
              <form action={handleSignup}>
                <CardHeader>
                  <CardTitle className="text-xl">Create Account</CardTitle>
                  <CardDescription>
                    Start your journey to financial freedom
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-signup">Full Name</Label>
                    <div className="relative">
                      <PiggyBank className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        id="name-signup" 
                        name="fullName"
                        placeholder="John Doe" 
                        type="text"
                        required
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 dark:bg-slate-900/50 dark:border-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        id="email-signup" 
                        name="email"
                        placeholder="you@example.com" 
                        type="email"
                        required
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 dark:bg-slate-900/50 dark:border-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        id="password-signup"
                        name="password" 
                        placeholder="Create a strong password" 
                        type="password"
                        required
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 dark:bg-slate-900/50 dark:border-slate-800"
                      />
                    </div>
                  </div>
                  <Button 
                    disabled={isPending}
                    type="submit"
                    className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors shadow-md shadow-emerald-500/20 mt-2 flex items-center justify-center gap-2"
                  >
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>Create Account <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

      </div>
    </div>
  );
}
