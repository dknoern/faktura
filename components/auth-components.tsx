import { signIn, signOut } from "@/auth"
import { Button } from "./ui/button"
import { cookies } from "next/headers"

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
        // Clear kiosk mode cookie when signing out
        const cookieStore = await cookies()
        cookieStore.delete('kiosk-mode')
        await signOut({redirectTo: "/", redirect: true})
      }}
      className="w-full"
    >
      <Button variant="ghost" className="w-full p-0" {...props}>
        Sign Out
      </Button>
    </form>
  )
}
