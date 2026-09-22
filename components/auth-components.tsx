import { signIn } from "@/auth"
import { Button } from "./ui/button"
import { SignOutButton } from "./sign-out-button"

// Force dynamic rendering for server actions
export const dynamic = 'force-dynamic';

export function SignIn({
  ...props
}: { provider?: string } & React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form
      action={async () => {
        "use server"
        await signIn('auth0')
      }}
    >
      <Button {...props}>Sign In</Button>
    </form>
  )
}

// Signs out via a client component that finishes with a full-page navigation
// to '/', keeping users on the host (and branding) they're browsing on
export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
  return <SignOutButton {...props} />
}
