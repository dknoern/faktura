"use client"

import { ProductActionMenu } from "../product-action-menu"
import { useEffect, useState } from "react"
import { z } from "zod"
import { customerSchema } from "@/lib/models/customer"

type Customer = z.infer<typeof customerSchema>

interface ProductHeaderProps {
    id: string;
    productStatus: string;
}

export function ProductHeader({ id, productStatus }: ProductHeaderProps) {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10
    })

    // Fetch customers on component mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/customers-data')
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
        }

        fetchCustomers()
    }, [])

    return (
        <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Product</h2>
            <ProductActionMenu 
                id={id} 
                customers={customers}
                pagination={pagination}
                productStatus={productStatus}
            />
        </div>
    );
}
