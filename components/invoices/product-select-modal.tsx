"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { searchFilteredInventoryItems } from "@/app/actions/inventory"
import { Badge } from "../ui/badge"

interface Product {
  _id: string
  itemNumber: string
  title: string
  sellingPrice?: number
  serialNo?: string
  longDesc?: string
  status?: string
}

interface PaginationProps {
  total: number
  pages: number
  currentPage: number
  limit: number
}

interface ProductSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onProductSelect: (product: Product) => void
  statuses?: string[]
  modalTitle?: string
}

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

export function ProductSelectModal({ isOpen, onClose, onProductSelect, statuses = ["Sold", "Memo", "Incoming", "In Stock", "Partnership"] }: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationProps>({
    total: 0,
    pages: 1,
    currentPage: 1,
    limit: 10
  })
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Debounce the search term with 300ms delay
  const debouncedSearch = useDebounce(search, 300)

  const fetchProducts = useCallback(async (searchTerm: string, page: number = 1) => {
    try {
      // Only show loading for initial load or when we have no products
      if (isInitialLoad || products.length === 0) {
        setLoading(true)
      }
      setError(null)
      
      const result = await searchFilteredInventoryItems(searchTerm, statuses, page, 10)
      
      if (result.success && result.data) {
        setProducts(result.data)
        setPagination(result.pagination || {
          total: 0,
          pages: 1,
          currentPage: 1,
          limit: 10
        })
      } else {
        setError(result.error || "No products found")
        setProducts([])
        setPagination({
          total: 0,
          pages: 1,
          currentPage: 1,
          limit: 10
        })
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to load products")
      setProducts([])
      setPagination({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10
      })
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }, [statuses, isInitialLoad, products.length])


  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsInitialLoad(true)
      setProducts([])
      setSearch("")
      setCurrentPage(1)
      setError(null)
    }
  }, [isOpen])
  
  // Fetch products when debounced search changes (only when modal is open)
  useEffect(() => {
    if (isOpen) {
      fetchProducts(debouncedSearch, currentPage)
    }
  }, [isOpen, debouncedSearch, currentPage, fetchProducts])
  
  // Fix for scrolling issues - ensure body scroll is restored
  useEffect(() => {
    // When dialog closes, ensure body scroll is enabled
    if (!isOpen) {
      // Small timeout to ensure this runs after dialog's own effects
      setTimeout(() => {
        document.body.style.removeProperty('overflow')
        document.body.style.removeProperty('padding-right')
      }, 100)
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('padding-right')
    }
  }, [isOpen])

  // Handle search input changes (debouncing is handled by useDebounce hook)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setCurrentPage(1) // Reset page when search changes
  }
  
  // Handle form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts(search, 1)
  }
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleProductSelect = (product: Product) => {
    onProductSelect(product)
    onClose()
  }
  
  // Make the entire row clickable
  const handleRowClick = (product: Product) => {
    handleProductSelect(product)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] top-[10%] translate-y-0">
        <DialogHeader>
          <DialogTitle>Select Product ({statuses.join(", ")})</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 my-4">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={handleSearchChange}
            className="flex-1"
          />
        </form>
        
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading products...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p>No products found</p>
                      <Button variant="outline" size="sm" onClick={() => fetchProducts(search)}>
                        Refresh
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow 
                    key={product._id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(product)}
                  >
                    <TableCell>{product.itemNumber}</TableCell>
                    <TableCell>{product.title}</TableCell>
                    <TableCell>${product.sellingPrice?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>
                                <Badge style={{ backgroundColor: product.status === 'In Stock' ? 'green' : product.status === 'Sold' ? 'grey' : product.status === 'Incoming' ? 'teal' : product.status === 'Sale Pending' ? 'red' : 'orange' }}>
                                    {product.status}
                                </Badge>
                            </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {products.length} of {pagination.total} products
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center">
                <span className="px-2">Page {pagination.currentPage} of {pagination.pages}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.pages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
