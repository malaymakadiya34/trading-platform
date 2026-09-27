import type { Metadata } from "next";

import { AuthPage } from "@/src/components/auth/auth-page";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
