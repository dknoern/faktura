import { auth } from "@/auth";

/**
 * Get the current user from the session token
 * @returns The user object or null if not authenticated
 */
export async function getUserFromToken() {
  // For now, we're just using the auth() function which accesses the session
  // In the future, you might want to extract user info from the request if needed
  const session = await auth();
  return session?.user || null;
}

export async function getShortUserFromToken() {
  const user = await getUserFromToken();
  const email = user?.email || "System";
  if(email.includes("@")) {
    return email.split("@")[0];
  }
  return email;
}





  
