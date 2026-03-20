/**
 * ==========================================
 * LOGIN PAGE (app/login/page.tsx)
 * IDENTIFIER: Public Auth View (URL: "/login")
 * PURPOSE: Renders the full-screen authentication setup. Bypasses the sidebar layout.
 * ==========================================
 */
import { AuthForm } from "@/components/features/auth/AuthForm";

export default function LoginPage() {
  return <AuthForm />;
}
