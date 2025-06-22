"use client"

import { ProductsTable } from "@/components/products/table";
import { SkeletonTable } from "@/components/skeletons";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
      const search = searchParams.get('search') || '';
      const limit = 10;

      try {
        const response = await fetch(`/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
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
        {isLoading ? (
          <SkeletonTable />
        ) : (
          <ProductsTable products={products} pagination={pagination} />
        )}
      </div>
    </div>
  );
}