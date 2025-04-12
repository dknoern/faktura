import { ProductsTable } from "@/components/products/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense } from "react";
import { fetchProducts } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
type SearchParams = Promise<{ page: string, search?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || '';
  const limit = 10;

  const { products, pagination } = await fetchProducts(page, limit, search);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Products</h2>
        <Link href="/dashboard/products/new">
          <Button className="flex items-center gap-1">
            <PlusCircle size={18} />
            <span>New Product</span>
          </Button>
        </Link>
      </div>
      <div>
        <Suspense fallback={<SkeletonTable />}>
          <ProductsTable products={products} pagination={pagination} />
        </Suspense>
      </div>
    </div>
  );
}