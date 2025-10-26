import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  // Add admin check logic here if needed
  // if (!user.isAdmin) {
  //   redirect("/unauthorized");
  // }
  return user;
}

export function getAuthRedirectUrl(callbackUrl?: string | null) {
  if (callbackUrl && callbackUrl.startsWith("/")) {
    return callbackUrl;
  }
  return "/home";
}
