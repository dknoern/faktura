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


export async function getCustomClaimsFromToken(claimName: string) {
  try {
    const session = await auth();
    
    // Check if we have a session
    if (!session) {
      console.log("No session found");
      return null;
    }

    const claim = (session as any)?.[claimName];
    if (claim) {
      console.log(`Found claim ${claimName}:`, claim);
    } else {
      console.log(`No claim ${claimName} found in session`);
    }

    return claim || null;

  } catch (error) {
    console.error(`Error extracting claim ${claimName} from session:`, error);
    return null;
  }
}
