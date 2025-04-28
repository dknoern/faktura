"use client"

import { useState, useEffect } from "react"
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

interface ProductSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductSelect: (product: Product) => void
}

export function ProductSelectDialog({ open, onOpenChange, onProductSelect }: ProductSelectDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Fetch products when dialog opens or page changes
  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open, page])

  const fetchProducts = async () => {
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
        setError("No products found")
        setProducts([])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to load products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const handleProductSelect = (product: Product) => {
    onProductSelect(product)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select Inventory Item</DialogTitle>
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
                    onClick={() => handleProductSelect(product)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
