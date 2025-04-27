"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, PlusCircle, Loader2 } from "lucide-react"

interface Product {
  _id: string
  itemNumber: string
  title: string
  sellingPrice?: number
  serialNo?: string
  longDesc?: string
}

interface ProductSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onProductSelect: (product: Product) => void
}

// Sample product data for testing when API isn't available
const SAMPLE_PRODUCTS: Product[] = [
  { _id: "1", itemNumber: "64119", title: "Rolex GMT-Master II 126710BLNR", sellingPrice: 17500, serialNo: "08C74425" },
  { _id: "2", itemNumber: "64120", title: "Omega Seamaster 300M", sellingPrice: 5500, serialNo: "12345678" },
  { _id: "3", itemNumber: "64121", title: "Cartier Santos Medium", sellingPrice: 7200, serialNo: "87654321" },
  { _id: "4", itemNumber: "64122", title: "Tudor Black Bay 58", sellingPrice: 3800, serialNo: "TB58123" },
  { _id: "5", itemNumber: "64123", title: "Grand Seiko SBGA211", sellingPrice: 6300, serialNo: "GS211456" },
]

export function ProductSelectModal({ isOpen, onClose, onProductSelect }: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/products?page=${page}&limit=10&search=${search}`)
      
      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.products) {
        setProducts(data.products)
        setTotalPages(data.pagination?.pages || 1)
      } else {
        // Fallback to sample data if API doesn't return expected format
        console.warn("API didn't return expected data format, using sample data")
        setProducts(SAMPLE_PRODUCTS)
        setTotalPages(1)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to load products. Using sample data instead.")
      // Fallback to sample data on error
      setProducts(SAMPLE_PRODUCTS)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, search])


  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen, page, fetchProducts])

  // Only trigger fetch when search button is clicked, not on every search change
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
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
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSearch} className="flex items-center space-x-2 my-4">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
        
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Number</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
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
                      <Button variant="outline" size="sm" onClick={() => fetchProducts()}>
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
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="p-0 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleProductSelect(product);
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
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
