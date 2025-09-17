import { Avatar, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { auth } from "@/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { SignIn, SignOut } from "./auth-components"
import { enterKioskMode } from "@/lib/kiosk-actions"
import { Monitor } from "lucide-react"
import { cookies } from "next/headers"

export default async function UserButton() {
  const session = await auth()
  if (!session?.user) return <SignIn />
  
  // Check if already in kiosk mode
  const cookieStore = await cookies()
  const isKioskMode = cookieStore.get('kiosk-mode')?.value === 'true'
  
  // Check if kiosk mode is enabled via environment variable
  const kioskEnabled = process.env.KIOSK_ENABLED === 'true'
  return (
    <div className="flex items-center gap-2">

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  session.user.image ??
                  `https://api.dicebear.com/9.x/thumbs/svg?seed=${Math.floor(Math.random() * 100000) + 1}&randomizeIds=true`
                }
                alt={session.user.name ?? ""}
              />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isKioskMode && kioskEnabled && (
            <>
              <DropdownMenuItem asChild>
                <form action={enterKioskMode}>
                  <button type="submit" className="flex w-full items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Kiosk Mode
                  </button>
                </form>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem>
            <SignOut />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
