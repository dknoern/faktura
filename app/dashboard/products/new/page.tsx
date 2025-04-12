import ProductEditForm from '@/components/products/editForm';
import { productSchema } from '@/lib/models/product';
import { z } from 'zod';

export default async function Page() {
  // Create an empty product object with default values
  const emptyProduct: z.infer<typeof productSchema> = {
    id: '',
    productType: '',
    title: '',
    itemNumber: '',
    manufacturer: '',
    model: '',
    modelNumber: '',
    condition: '',
    gender: '',
    features: '',
    case: '',
    dial: '',
    bracelet: '',
    serialNo: '',
    longDesc: '',
    sellerType: '',
    seller: '',
    comments: '',
    sellingPrice: 0,
    listPrice: 0,
    cost: 0,
    totalRepairCost: 0,
    status: 'In Stock',
    ebayNoReserve: false,
    inventoryItem: false,
    history: []
  };

  return (
    <div className="container mx-auto py-1">
      <div className="mb-4">
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Create New Product</h2>
      </div>

      <div className="space-y-8">
        <ProductEditForm 
          product={emptyProduct} 
          repairs={[]} 
        />
      </div>
    </div>
  );
}
