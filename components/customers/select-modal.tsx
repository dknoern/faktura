"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { z } from "zod"
import { customerSchema } from "@/lib/models/customer"

type Customer = z.infer<typeof customerSchema>

interface CustomerSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (customer: Customer) => void
  customers: Customer[]
  pagination: {
    total: number
    pages: number
    currentPage: number
    limit: number
  }
}

export function CustomerSelectModal({
  isOpen,
  onClose,
  onSelect,
  customers,
  pagination,
}: CustomerSelectModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const customersList = Array.isArray(customers) ? customers : []

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('customerSearch', value)
      params.set('customerPage', '1') // Reset to first page when searching
    } else {
      params.delete('customerSearch')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('customerPage', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <div className="mb-4">
          <DialogTitle className="text-xl font-bold">Select Customer</DialogTitle>
        </div>

        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customersList.map((customer) => (
                  <TableRow
                    key={customer._id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <TableCell>{customer._id}</TableCell>
                    <TableCell>{customer.firstName + " " + customer.lastName}</TableCell>
                    <TableCell>{customer.company || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {customersList.length} of {pagination.total} customers
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                Previous
              </Button>
              <div className="flex items-center">
                <span className="px-2">Page {pagination.currentPage} of {pagination.pages}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
