/**
 * ==========================================
 * ROOT LAYOUT (app/layout.tsx)
 * IDENTIFIER: Global Application Wrapper
 * PURPOSE: The absolute base of your app. Applies global HTML, Body, Fonts, and CSS.
 * NOTE: No Sidebars or Navbars go here, so the Login page doesn't inherit them!
 * ==========================================
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Budget System",
  description: "AI-powered budgeting and financial insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We use client-side logic to hide sidebar for the login page typically,
  // but for a true production app, we would use Route Groups like app/(dashboard)/layout.tsx
  // For now, Next.js allows children to render globally.
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
