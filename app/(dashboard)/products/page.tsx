"use client"

import { ProductsTable } from "@/components/products/table";
import { SkeletonTable } from "@/components/skeletons";
import { Suspense, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1, limit: 50 });
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
      const search = searchParams.get('search') || '';
      const sortBy = searchParams.get('sortBy') || 'lastUpdated';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const limit = 50;

      try {
        const response = await fetch(`/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const { products: fetchedProducts, pagination: fetchedPagination } = await response.json();
        setProducts(fetchedProducts);
        setPagination(fetchedPagination);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [searchParams]);

  useEffect(() => {
    // Check for delete success message
    const deleteSuccess = sessionStorage.getItem('deleteSuccess');
    if (deleteSuccess) {
      toast.success(deleteSuccess);
      sessionStorage.removeItem('deleteSuccess');
    }
  }, []);

  return (
<div>
<div>
  <Suspense fallback={<SkeletonTable />}>
    <ProductsTable products={products} pagination={pagination} />
  </Suspense>
</div>
</div>



  );
}