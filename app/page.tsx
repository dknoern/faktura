import { Button } from '@/components/ui/button';
import { signIn } from "@/auth"

// Force dynamic rendering to avoid clientReferenceManifest issues with server actions
export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <main className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/rolex-blackbook.png)' }}
      />
      
      {/* Sign In Button - Upper Right */}
      <div className="absolute top-6 right-6 z-10">
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
