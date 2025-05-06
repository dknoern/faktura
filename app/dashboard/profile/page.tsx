import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile/form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

async function getProfile() {
  try {
    // This runs on the server, so we need to construct the full URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const session = await auth();
    
    if (!session?.user) {
      return null;
    }
    
    const response = await fetch(`${baseUrl}/api/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `next-auth.session-token=${(session as any).token}`, // Pass the session cookie
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export default async function ProfilePage() {
  const profile = await getProfile();
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </div>
      
      <div className="grid gap-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}