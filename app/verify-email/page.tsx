import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { SignOut } from "@/components/auth-components";
import { auth } from "@/auth";
import { ResendButton } from "./resend-button";

export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage() {
  const session = await auth();
  const email = session?.user?.email || "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a verification link to <strong>{email}</strong>. Click it to unlock your
            account, then sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResendButton email={email} />
        </CardContent>
        <CardFooter>
          <SignOut />
        </CardFooter>
      </Card>
    </main>
  );
}
