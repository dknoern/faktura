import { SignUpForm } from "./signup-form";

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <SignUpForm />
    </main>
  );
}
