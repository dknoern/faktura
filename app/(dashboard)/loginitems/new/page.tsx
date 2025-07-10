import { LogForm } from '@/components/logs/form';
import { getShortUser } from '@/lib/auth-utils';

export default async function Page() {

    const user = await getShortUser()

  return (
    <div className="container mx-auto py-1">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight">New Log In Item</h2>
      </div>
      <LogForm user={user} />
    </div>
  );
} 