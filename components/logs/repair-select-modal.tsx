"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { searchRepairItems } from "@/app/actions/inventory"

interface Repair {
  _id: string
  repairNumber: string
  itemNumber: string
  description: string
  repairCost?: number
  status?: string
}

interface RepairSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onRepairSelect: (repair: Repair) => void
}

export function RepairSelectModal({ isOpen, onClose, onRepairSelect }: RepairSelectModalProps) {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchRepairs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the server action instead of fetch API
      const result = await searchRepairItems(search)
      
      if (result.success) {
        // The searchRepairItems returns all results without pagination
        // We need to handle pagination on the client side
        const allRepairs = result.data
        const totalItems = allRepairs.length
        const totalPageCount = Math.ceil(totalItems / 10)
        
        // Calculate the slice of repairs for the current page
        const startIndex = (page - 1) * 10
        const endIndex = Math.min(startIndex + 10, totalItems)
        const currentPageRepairs = allRepairs.slice(startIndex, endIndex)
        
        setRepairs(currentPageRepairs)
        setTotalPages(totalPageCount)
      } else {
        setError(result.error || "No repairs found")
        setRepairs([])
      }
    } catch (error) {
      console.error("Error fetching repairs:", error)
      setError("Failed to load repairs")
      setRepairs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchRepairs()
    }
    
    return () => {
      // Clear any pending timeouts when component unmounts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [isOpen, page])

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
      fetchRepairs()
    }, 300) // 300ms debounce delay
  }
  
  // Handle form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchRepairs()
  }

  const handleRepairSelect = (repair: Repair) => {
    onRepairSelect(repair)
    onClose()
  }
  
  // Make the entire row clickable
  const handleRowClick = (repair: Repair) => {
    handleRepairSelect(repair)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select Repair</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 my-4">
          <Input
            placeholder="Search repairs by number or description..."
            value={search}
            onChange={handleSearchChange}
            className="flex-1"
          />
        </form>
        
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repair #</TableHead>
                <TableHead>Item #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Repair Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading repairs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : repairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p>No repairs found</p>
                      <Button variant="outline" size="sm" onClick={() => fetchRepairs()}>
                        Refresh
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                repairs.map((repair) => (
                  <TableRow 
                    key={repair._id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(repair)}
                  >
                    <TableCell>{repair.repairNumber}</TableCell>
                    <TableCell>{repair.itemNumber}</TableCell>
                    <TableCell>{repair.description}</TableCell>
                    <TableCell>${repair.repairCost?.toFixed(2) || "0.00"}</TableCell>
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
      </DialogContent>
    </Dialog>
  )
}
