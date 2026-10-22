import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { z } from "zod";
import { checkoutRateLimited, requestClient } from "@/app/checkout-rate-limit";
import { clearLoginAttempts, isLoginRateLimited, recordFailedLogin } from "@/app/login-rate-limit";
import { openStoreDb } from "@/db/store";
import { storeAccounts, storeAuthenticators, storeSessions, storeUsers, storeVerificationTokens } from "@/db/store-schema";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({ email: z.string().trim().toLowerCase().email().max(255), password: z.string().min(8).max(128) });
const authClient = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
const authDb = authClient ? drizzle(authClient) : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: authDb ? DrizzleAdapter(authDb, { usersTable: storeUsers, accountsTable: storeAccounts, sessionsTable: storeSessions, verificationTokensTable: storeVerificationTokens, authenticatorsTable: storeAuthenticators }) : undefined,
  session: { strategy: "jwt" },
  pages: { signIn: "/dang-nhap" },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Mật khẩu", type: "password" } },
    async authorize(credentials, request) {
      const client = requestClient(request);
      if (checkoutRateLimited(`customer-login:${client}`)) return null;
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const loginKey = `customer-login:${client}:${parsed.data.email}`;
      if (isLoginRateLimited(loginKey)) return null;
      const { db, close } = openStoreDb();
      try {
        const user = (await db.select().from(storeUsers).where(eq(storeUsers.email, parsed.data.email)).limit(1))[0];
        if (!user?.passwordHash || !await verifyPassword(parsed.data.password, user.passwordHash)) { recordFailedLogin(loginKey); return null; }
        clearLoginAttempts(loginKey);
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      } finally { await close(); }
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user?.id) token.id = user.id; return token; },
    session({ session, token }) { if (session.user && token.id) session.user.id = String(token.id); return session; },
  },
});
