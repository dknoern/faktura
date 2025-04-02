import { notFound } from 'next/navigation';
import { fetchLogItemById } from '@/lib/data';
import { LogForm } from '@/components/logs/form';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const logitem = await fetchLogItemById(id);

  if (!logitem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-1">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Log</h2>
      </div>

      <LogForm log={JSON.parse(JSON.stringify(logitem))} />
    </div>
  );
}

