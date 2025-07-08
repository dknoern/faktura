"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { LinkTableCell } from "@/components/LinkTableCell"
import { CustomerSelectModalWrapper } from "@/components/customers/select-modal-wrapper"
import { customerSchema } from "@/lib/models/customer"
import { z } from "zod"

interface Proposal {
  _id: number
  customerFirstName: string
  customerLastName: string
  date: string
  total: number
  status?: string
}

interface Pagination {
  total: number
  pages: number
  currentPage: number
  limit: number
}

interface ProposalsTableProps {
  proposals: Proposal[]
  pagination: Pagination
}

export function ProposalsTable({ proposals, pagination }: ProposalsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [customers, setCustomers] = useState<z.infer<typeof customerSchema>[]>([])
  const [customersPagination, setCustomersPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1,
    limit: 10
  })
  
  // Load customer data when modal opens
  useEffect(() => {
    if (isCustomerModalOpen) {
      const loadCustomers = async () => {
        try {
          const result = await fetch('/api/customers-data')
            .then(res => res.json())
            .catch(() => ({
              customers: [],
              pagination: { total: 0, pages: 1, currentPage: 1, limit: 10 }
            }))
          
          setCustomers(result.customers || [])
          setCustomersPagination(result.pagination || { 
            total: 0, 
            pages: 1, 
            currentPage: 1, 
            limit: 10 
          })
        } catch (error) {
          console.error('Error loading customers:', error)
        }
      }
      
      loadCustomers()
    }
  }, [isCustomerModalOpen])

  // Search as user types with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (searchTerm) {
        params.set('search', searchTerm)
      } else {
        params.delete('search')
      }
      params.delete('page') // Reset to first page when searching
      router.push(`/proposals?${params.toString()}`)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchParams, router])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/proposals?${params.toString()}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button 
          variant="outline"
          onClick={() => setIsCustomerModalOpen(true)}
          className="ml-4 flex items-center gap-1"
        >
          <Plus size={18} />
          <span>New Proposal</span>
        </Button>
      </div>
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proposal #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal._id} className="cursor-pointer hover:bg-muted/50">
                <LinkTableCell href={`/proposals/${proposal._id}/view`}>
                  {proposal._id}
                </LinkTableCell>
                <LinkTableCell href={`/proposals/${proposal._id}/view`}>
                  {proposal.customerFirstName} {proposal.customerLastName}
                </LinkTableCell>
                <LinkTableCell href={`/proposals/${proposal._id}/view`}>
                  {formatDate(proposal.date)}
                </LinkTableCell>
                <LinkTableCell href={`/proposals/${proposal._id}/view`}>
                  {formatCurrency(proposal.total)}
                </LinkTableCell>
                <LinkTableCell href={`/proposals/${proposal._id}/view`}>
                  {proposal.status || 'Draft'}
                </LinkTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {proposals.length} of {pagination.total} proposals
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

      {/* Customer selection modal */}
      <CustomerSelectModalWrapper
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customer) => {
          router.push(`/proposals/new/${customer._id}`)
          setIsCustomerModalOpen(false)
        }}
        customers={customers}
        pagination={customersPagination}
      />
    </div>
  )
}
