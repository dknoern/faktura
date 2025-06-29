import ProductEditForm from '@/components/products/editForm';
import { fetchProductById, getRepairsForItem } from '@/lib/data';
import { notFound } from 'next/navigation';
import { StatusUpdateToast } from '@/components/status-update-toast';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [product, repairs] = await Promise.all([
    fetchProductById(id),
    getRepairsForItem(id),
  ]);

  if (!product) {
    notFound();
  }
  return (
    <div className="container mx-auto py-1">
      <StatusUpdateToast />
      <h2 className="text-2xl font-bold tracking-tight">Product</h2>

      <div className="space-y-8">
        <ProductEditForm 
          product={JSON.parse(JSON.stringify(product))} 
          repairs={JSON.parse(JSON.stringify(repairs))} 
        />
      </div>
    </div>
  );
}
