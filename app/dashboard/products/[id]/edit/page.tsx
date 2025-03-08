
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
      <h1>Edit Product</h1>
      <div>
        {product.title}
      </div>
    </div>

  );
}

