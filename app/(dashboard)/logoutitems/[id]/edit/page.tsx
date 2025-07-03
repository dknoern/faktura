import { notFound } from 'next/navigation';
import { fetchOutById } from '@/lib/data';
import { OutForm } from '@/components/outs/form'

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const [outItem] = await Promise.all([
    fetchOutById(id),
  ]);

  if (!outItem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-1">

      <div className="space-y-8">
        <OutForm out={JSON.parse(JSON.stringify(outItem))} />
      </div>
    </div>
  );
}
