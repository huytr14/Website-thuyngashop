import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import AuthForm from "@/app/auth-form";

export const metadata: Metadata = { title: "Đăng nhập | THUYNGA Shop", robots: { index: false, follow: false } };

export default function LoginPage() { return <PublicPage><AuthForm mode="login"/></PublicPage>; }
