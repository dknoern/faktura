import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import { signIn } from "@/auth"
import { fetchTenantByHost } from '@/lib/data';
import { PublicLanding } from '@/components/landing/public-landing';

// Force dynamic rendering to avoid clientReferenceManifest issues with server actions
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Data-driven branding: a host matching a tenant's custom domain gets that
  // tenant's branded welcome page (no self-signup); everything else gets the
  // generic Fakturian landing with signup.
  const headersList = await headers();
  const host = headersList.get('host');
  const tenant = await fetchTenantByHost(host);

  if (!tenant) {
    return <PublicLanding />;
  }

  const splashUrl = tenant.splashImage
    ? `/api/images/splash-${tenant._id}.jpg?v=${encodeURIComponent(tenant.splashImage)}`
    : '/rolex-blackbook.png';

  return (
    <main className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${splashUrl})` }}
      />

      {/* Sign In Button - Upper Right (self-serve signup is not offered on branded domains) */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        <form
          action={async () => {
            "use server"
            await signIn('auth0', { redirectTo: "/home" })
          }}
        >
          <Button
            variant="outline"
            className="bg-transparent border-white/50 text-white font-bold hover:bg-white/10 backdrop-blur-sm"
          >
            Sign In
          </Button>
        </form>
      </div>
    </main>
  );
}
