import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignUpForm } from "./signup-form";
import { fetchTenantByHost } from "@/lib/data";

export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  // Self-serve signup is not offered on tenant-branded custom domains
  const headersList = await headers();
  const tenant = await fetchTenantByHost(headersList.get('host'));
  if (tenant) {
    redirect('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <SignUpForm />
    </main>
  );
}
