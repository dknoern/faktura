"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

interface ProductSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onProductSelect: (product: Product) => void
  statuses?: string[]
  modalTitle?: string
}

export function ProductSelectModal({ isOpen, onClose, onProductSelect, statuses = ["Sold", "Memo", "Incoming", "In Stock", "Partnership"] }: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProducts = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const searchValue = searchTerm !== undefined ? searchTerm : search
      
      // Use either the custom search function or the default one
      const result = searchFilteredInventoryItems(searchValue, statuses)
      
      if ((await result).success && (await result).data) {
        setProducts((await result).data)
        //setTotalPages(result.pagination?.pages || 1)
      } else {
        setError((await result).error || "No products found")
        setProducts([])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to load products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [search, statuses])


  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
    
    return () => {
      // Clear any pending timeouts when component unmounts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [isOpen, page, fetchProducts])
  
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

  // Handle search input changes with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set a new timeout to delay the search
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1)
      fetchProducts(value)
    }, 150) // Reduced debounce delay for more responsive search
  }
  
  // Handle form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts(search)
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
      <DialogContent className="sm:max-w-[800px]">
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
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
