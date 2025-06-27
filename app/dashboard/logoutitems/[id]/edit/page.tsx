import { notFound } from 'next/navigation';
import { fetchOutById } from '@/lib/data';
import { OutForm } from '@/components/outs/form'
import { ImageGallery } from '@/components/products/image-gallery';
import { getProductImages } from '@/lib/utils/storage';
import { OutHeader } from '@/components/outs/out-header';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const [outItem, images] = await Promise.all([
    fetchOutById(id),
    getProductImages(id)
  ]);

  if (!outItem) {
    notFound();
  }

  return (
    <div className="container mx-auto py-1">
      <OutHeader id={id} />

      <div className="space-y-8">
        <OutForm out={JSON.parse(JSON.stringify(outItem))} />
        <ImageGallery images={images} />
      </div>
    </div>
  );
}
