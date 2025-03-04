
import { Button } from '@/components/ui/button';
import { signIn, signOut } from "@/auth"
import { auth } from "../auth"
import Image from 'next/image'

export default async function Page({...props}) {

  const session = await auth()
  return (
    <main className="flex min-h-screen flex-col p-6">


      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">

          <p >
            <strong>Welcome to Lager.<br/></strong> Inventory, invoicing, and repairs for your business.
          </p>



<Image src="/background.webp" alt="Lager Logo" layout="fill" className="bg-img" />
<div>
          <form
      action={async () => {
        "use server"
        await signIn('auth0', { redirectTo: "/dashboard" }) 
      }}
    >
      <Button>Sign In</Button>
    </form>
    </div>

    <form
      action={async () => {
        "use server"
        await signOut({redirectTo: "/", redirect: true})
      }}
      className="w-full"
    >


      
    </form>

        </div>


        
      </div>
    </main>
  );
}
