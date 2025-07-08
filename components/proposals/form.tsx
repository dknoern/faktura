"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProposalLineItems, ProposalLineItem } from "./line-items"
import { upsertProposal } from "@/lib/proposalActions"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

interface Customer {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

interface Proposal {
  _id?: number
  customerId: string
  customerFirstName: string
  customerLastName: string
  date: string
  total: number
  lineItems: ProposalLineItem[]
  status?: string
}

interface ProposalFormProps {
  customer: Customer
  proposal?: Proposal
}

export function ProposalForm({ customer, proposal }: ProposalFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    customerId: customer._id,
    customerFirstName: customer.firstName,
    customerLastName: customer.lastName,
    date: proposal?.date || new Date().toISOString().split('T')[0],
    status: proposal?.status || 'Draft'
  })

  const [lineItems, setLineItems] = useState<ProposalLineItem[]>(
    proposal?.lineItems || [{ name: "", longDesc: "", amount: 0 }]
  )

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate line items
    const validLineItems = lineItems.filter(item => item.name.trim() !== "")
    if (validLineItems.length === 0) {
      toast.error("Please add at least one line item")
      return
    }

    const proposalData = {
      ...formData,
      customerId: parseInt(formData.customerId),
      lineItems: validLineItems,
      total: calculateTotal()
    }

    startTransition(async () => {
      try {
        const result = await upsertProposal(proposalData, proposal?._id)
        if (result.success) {
          toast.success(proposal ? "Proposal updated successfully" : "Proposal created successfully")
          router.push(`/proposals/${result.proposalId}/view`)
        } else {
          toast.error(result.error || "Failed to save proposal")
        }
      } catch (error) {
        console.error("Error saving proposal:", error)
        toast.error("Failed to save proposal")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{proposal ? "Edit Proposal" : "New Proposal"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer</Label>
              <Input
                id="customerName"
                value={`${customer.firstName} ${customer.lastName}`}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                value={`$${calculateTotal().toFixed(2)}`}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ProposalLineItems items={lineItems} onChange={setLineItems} />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : proposal ? "Update Proposal" : "Create Proposal"}
        </Button>
      </div>
    </form>
  )
}
