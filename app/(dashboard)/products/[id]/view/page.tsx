import { ImageGallery } from '@/components/products/image-gallery';
import { fetchProductById, getRepairsForItem, fetchCustomers } from '@/lib/data';
import { getProductImages } from '@/lib/utils/storage';
import { notFound } from 'next/navigation';
import { StatusUpdateToast } from '@/components/status-update-toast';
import { ProductActionMenu } from '@/components/products/product-action-menu';
import { ProductViewDetails } from '@/components/products/product-view-details';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [product, repairs, productImages, customers] = await Promise.all([
    fetchProductById(id),
    getRepairsForItem(id),
    getProductImages(id),
    fetchCustomers()
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-1">
      <StatusUpdateToast />

      <div className="flex justify-between items-center mb-6">
        <span className="flex items-center">

          <h1 className="text-3xl font-bold">{product.itemNumber}</h1></span>
        <ProductActionMenu 
          id={id} 
          productStatus={product.status}
          customers={customers.customers}
          pagination={customers.pagination}
        />
      </div>


      <div className="space-y-8">
        <ProductViewDetails 
          product={JSON.parse(JSON.stringify(product))} 
          repairs={JSON.parse(JSON.stringify(repairs))} 
        />
        <ImageGallery images={productImages} />
      </div>
    </div>
  );
}
