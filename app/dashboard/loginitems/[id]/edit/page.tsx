import { notFound } from 'next/navigation';
import { fetchLogItemById } from '@/lib/data';
import { LogForm } from '@/components/logs/form';
import { ImageGallery } from '@/components/products/image-gallery';
import { getProductImages } from '@/lib/utils/productImages';
import { ActionMenu } from "@/components/action-menu";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const [logitem, images] = await Promise.all([
    fetchLogItemById(id),
    getProductImages(id)
  ]);

  if (!logitem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-1">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Log</h2>
        <ActionMenu />
      </div>

      <div className="space-y-8">
        <LogForm log={JSON.parse(JSON.stringify(logitem))} />
        <ImageGallery images={images} />
      </div>
    </div>
  );
}

