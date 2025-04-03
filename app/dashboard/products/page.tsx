import { ProductsTable } from "@/components/products/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { fetchProducts } from "@/lib/data";
export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;

  const { products, pagination } = await fetchProducts(page, limit);
  return (
    <div>
      <div>
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Products</h2>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <ProductsTable products={products} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}