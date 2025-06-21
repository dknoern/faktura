"use client"

import ProductEditForm from '@/components/products/editForm';
import { productSchema } from '@/lib/models/product';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function Page() {
  const searchParams = useSearchParams();
  const isCloned = searchParams.get('cloned') === 'true';
  const [product, setProduct] = useState<z.infer<typeof productSchema> | null>(null);

  useEffect(() => {
    if (isCloned) {
      // Get cloned data from sessionStorage
      const clonedDataString = sessionStorage.getItem('clonedProductData');
      if (clonedDataString) {
        try {
          const clonedData = JSON.parse(clonedDataString);
          setProduct(clonedData);
          // Clear the sessionStorage after using it
          sessionStorage.removeItem('clonedProductData');
          // Show toast message after the page loads
          toast.success("Item cloned. Enter new item number, seller, serial number, and cost then create product.");
        } catch (error) {
          console.error('Error parsing cloned data:', error);
          setProduct(getEmptyProduct());
        }
      } else {
        setProduct(getEmptyProduct());
      }
    } else {
      setProduct(getEmptyProduct());
    }
  }, [isCloned]);

  const getEmptyProduct = (): z.infer<typeof productSchema> => {
    return {
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
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-1">
      <div className="mb-4">
        <h2 className='text-2xl font-bold tracking-tight pl-1.5'>
          {isCloned ? 'Clone Product' : 'Create New Product'}
        </h2>
      </div>

      <div className="space-y-8">
        <ProductEditForm 
          product={product} 
          repairs={[]} 
        />
      </div>
    </div>
  );
}
