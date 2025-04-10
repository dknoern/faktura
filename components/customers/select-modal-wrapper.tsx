"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { CustomersTable } from "./table"
import { z } from "zod"
import { customerSchema } from "@/lib/models/customer"

type Customer = z.infer<typeof customerSchema>

interface CustomerSelectModalWrapperProps {
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

export function CustomerSelectModalWrapper({
  isOpen,
  onClose,
  onSelect,
  customers: initialCustomers,
  pagination: initialPagination,
}: CustomerSelectModalWrapperProps) {
  
  // State for customers and pagination
  const [customers, setCustomers] = useState(initialCustomers)
  const [pagination, setPagination] = useState(initialPagination)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Function to fetch customers based on search and pagination
  const fetchCustomers = useCallback(async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery) {
        params.set('search', searchQuery)
      }
      params.set('page', currentPage.toString())

      // Fetch customers from API
      const response = await fetch(`/api/customers-data?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data = await response.json()
      setCustomers(data.customers || [])
      setPagination(data.pagination || {
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10
      })
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }, [searchQuery, currentPage])
  
  // Fetch customers when search or page changes
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
    }
  }, [isOpen, fetchCustomers])



  // Handle search query change
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Pass the customers table component but with isModal flag */}
          <CustomersTable 
            customers={customers} 
            pagination={pagination} 
            isModal={true} 
            onSelectCustomer={onSelect}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
