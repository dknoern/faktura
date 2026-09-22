import { redirect } from "next/navigation"
import { signIn, signOut } from "@/auth"
import { Button } from "./ui/button"

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

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form
      action={async () => {
        "use server"
        // Clear the session without letting Auth.js redirect: its redirect
        // resolves against AUTH_URL, which would bounce users on tenant
        // custom domains back to the platform host (generic landing page).
        // Next's own redirect stays on the host the user is browsing.
        await signOut({ redirect: false })
        redirect('/')
      }}
      className="w-full"
    >
      <Button variant="ghost" className="w-full p-0" {...props}>
        Sign Out
      </Button>
    </form>
  )
}
