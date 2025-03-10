
import ProductEditForm from '@/components/products/editForm';
import { fetchProductById } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [product] = await Promise.all([
    fetchProductById(id),

  ]);

  if (!product) {
    notFound();
  }
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Product</h2>
      </div>
      <div>
        <ProductEditForm product={JSON.parse(JSON.stringify(product))} foo="foovalue"  />
      </div>
    </div>
  );
}

