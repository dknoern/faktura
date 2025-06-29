import { notFound } from 'next/navigation';
import { fetchLogItemById } from '@/lib/data';
import { LogForm } from '@/components/logs/form';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const [logitem] = await Promise.all([
    fetchLogItemById(id),
  ]);

  if (!logitem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-1">

<div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Update Log In Item</h2>
      </div>


      <div className="space-y-8">
        <LogForm log={JSON.parse(JSON.stringify(logitem))} />
      </div>
    </div>
  );
}

