import { LogForm } from '@/components/logs/form';
import { auth } from '@/auth';

export default async function Page() {

    const session = await auth()

    let user = ""
    if(session?.user){
      user = session.user.name || ""
      if (user != null && user.length > 0 && user.indexOf("@") > 0) {
        user = user.substring(0, user.indexOf("@")).toLowerCase();
    }
    }

      
  return (
    <div className="container mx-auto py-1">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight">New Log In Item</h2>
      </div>
      <LogForm user={user} />
    </div>
  );
} 