import { notFound } from 'next/navigation';
import { fetchLogItemById } from '@/lib/data';
import { LogForm } from '@/components/logs/form';
import { ImageGallery } from '@/components/products/image-gallery';
import { getProductImages } from '@/lib/utils/storage';
import { LogHeader } from "@/components/log-header";

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
      <LogHeader id={id} />

      <div className="space-y-8">
        <LogForm log={JSON.parse(JSON.stringify(logitem))} />
        <ImageGallery images={images} />
      </div>
    </div>
  );
}

