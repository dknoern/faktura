import ProductEditForm from '@/components/products/editForm';
import { ImageGallery } from '@/components/products/image-gallery';
import { fetchProductById, getRepairsForItem } from '@/lib/data';
import { getProductImages } from '@/lib/utils/productImages';
import { notFound } from 'next/navigation';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [product, repairs, productImages] = await Promise.all([
      fetchProductById(id),
      getRepairsForItem(id),
      getProductImages(id)
    ]);

    if (!product) {
      notFound();
    }
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Product</h2>
      </div>
      <div className="space-y-6">
        <ProductEditForm product={JSON.parse(JSON.stringify(product))} repairs={JSON.parse(JSON.stringify(repairs))} />
        <ImageGallery images={productImages} />
      </div>
    </div>
  );
}



