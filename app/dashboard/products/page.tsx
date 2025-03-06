import { ProductsTable } from "@/components/products/table";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Products</h2>
      </div>
      <div>
      <ProductsTable />
      </div>
    </div>
  );
}