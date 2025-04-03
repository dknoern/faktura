import { ProductsTable } from "@/components/products/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { fetchProducts } from "@/lib/data";
type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || '';
  const limit = 10;

  const { products, pagination } = await fetchProducts(page, limit, search);
  return (
    <div>
      <div className="mb-4">
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