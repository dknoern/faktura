import { auth } from "@/auth";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ApiKeysSection } from "@/components/api-keys/api-keys-section";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user as any;

  const displayName = user?.fullName || user?.name || user?.email || "User";
  const tenantName = user?.tenantName;
  const email = user?.email;
  const isAdmin = user?.role === "admin";
  const avatarSrc =
    user?.image ??
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${email || displayName || "default"}`;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information and API access.</p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarSrc} alt={displayName} />
        </Avatar>
        <div className="space-y-1">
          <p className="text-lg font-medium">{displayName}</p>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
          {tenantName && (
            <p className="text-sm text-muted-foreground">
              Organization: <span className="font-medium text-foreground">{tenantName}</span>
            </p>
          )}
        </div>
      </div>

      <Separator />
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-muted-foreground">Choose your preferred color scheme.</p>
        </div>
        <ThemeToggle />
      </div>

      {isAdmin && (
        <>
          <Separator />
          <ApiKeysSection />
        </>
      )}
    </div>
  );
}
