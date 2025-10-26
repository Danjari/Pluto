import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  pages: {
    signIn: "/signin",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = (user as any).id ?? token.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) (session.user as any).id = token.sub;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always go to /home after successful sign-in
      // (If you want to respect callbackUrl when it's same-origin, swap in the commented logic)
      return `${baseUrl}/home`;
      // if (url.startsWith("/")) return `${baseUrl}${url}`;
      // if (url.startsWith(baseUrl)) return url;
      // return `${baseUrl}/home`;
    },
  },
};
