import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import AuthForm from "@/app/auth-form";
import { pageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> { return { ...await pageMetadata("Đăng nhập"), robots: { index: false, follow: false } }; }

export default function LoginPage() { return <PublicPage><AuthForm mode="login"/></PublicPage>; }
