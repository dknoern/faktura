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

export default async function UserButton() {
  const session = await auth()
  if (!session?.user) return <SignIn />
  return (
    <div className="flex items-center gap-2">

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  session.user.image ??
                  `https://api.dicebear.com/9.x/thumbs/svg?seed=${session.user.email || session.user.name || 'default'}`
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
          <DropdownMenuItem>
            <SignOut />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
