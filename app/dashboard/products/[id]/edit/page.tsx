import ProductEditForm from '@/components/products/editForm';
import { ImageGallery } from '@/components/products/image-gallery';
import { fetchProductById, getRepairsForItem } from '@/lib/data';
import { getProductImages } from '@/lib/utils/storage';
import { notFound } from 'next/navigation';
import { ProductHeader } from '@/components/products/product-header';
import { StatusUpdateToast } from '@/components/status-update-toast';

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
    <div className="container mx-auto py-1">
      <StatusUpdateToast />
      <ProductHeader id={id} productStatus={product.status} />

      <div className="space-y-8">
        <ProductEditForm 
          product={JSON.parse(JSON.stringify(product))} 
          repairs={JSON.parse(JSON.stringify(repairs))} 
        />
        <ImageGallery images={productImages} />
      </div>
    </div>
  );
}
