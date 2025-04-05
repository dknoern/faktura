import { notFound } from 'next/navigation';
import { fetchOutById } from '@/lib/data';
import { OutForm } from '@/components/outs/form';
import { ImageGallery } from '@/components/products/image-gallery';
import { getProductImages } from '@/lib/utils/productImages';

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
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Edit Log Out Item</h2>
      </div>

      <div className="space-y-8">
        <OutForm out={JSON.parse(JSON.stringify(outItem))} />
        <ImageGallery images={images} />
      </div>
    </div>
  );
}
