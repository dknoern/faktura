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
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">New Log Item</h2>
      </div>
      <LogForm user={user} />
    </div>
  );
} 