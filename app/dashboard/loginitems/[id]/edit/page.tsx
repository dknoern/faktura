import { notFound } from 'next/navigation';
import { fetchLogItemById } from '@/lib/data';
import { LogForm } from '@/components/logs/form';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  console.log('loading logitem', id);
  const logitem = await fetchLogItemById(id);

  if (!logitem) {
    console.log('llogitem', id, 'not found');
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Edit Log Item</h2>
      </div>

      <LogForm log={JSON.parse(JSON.stringify(logitem))} />
    </div>
  );
}

