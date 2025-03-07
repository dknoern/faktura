import { ItemsBySellerTypeTable } from "@/components/reports/itemsBySellerTypeTable";
export default async function Page() {
  return (
    <div>
      <div>
      <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Consignment Items</h2>
      </div>
      <div>
      <ItemsBySellerTypeTable sellerType="Consignment"/>
      </div>
    </div>
  );
}