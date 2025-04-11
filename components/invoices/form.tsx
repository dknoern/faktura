"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LineItems, LineItem } from "./line-items"
import { Printer, Edit, Mail } from "lucide-react"

interface InvoiceFormData {
  _id?: number
  invoiceNo?: string
  customerId?: number
  customerFirstName: string
  customerLastName: string
  customerEmail?: string
  customerPhone?: string
  date: string
  shipVia?: string
  paidBy?: string
  authNumber?: string
  subtotal?: number
  tax?: number
  shipping?: number
  total: number
  methodOfSale?: string
  salesPerson?: string
  invoiceType?: string
  shipToName?: string
  shipAddress1?: string
  shipAddress2?: string
  shipAddress3?: string
  shipCity?: string
  shipState?: string
  shipZip?: string
  shipCountry?: string
  billingAddress1?: string
  billingAddress2?: string
  billingAddress3?: string
  billingCity?: string
  billingState?: string
  billingZip?: string
  billingCountry?: string
  copyAddress?: boolean
  taxExempt?: boolean
  lineItems: LineItem[]
  trackingNumber?: string
}

interface Customer {
  _id: number
  firstName: string
  lastName: string
  company?: string
  email?: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
}

export function InvoiceForm({ invoice, selectedCustomer }: { invoice?: InvoiceFormData, selectedCustomer?: Customer }) {
  const router = useRouter()
  const [formData, setFormData] = useState<InvoiceFormData>(
    invoice || {
      customerFirstName: selectedCustomer?.firstName || "",
      customerLastName: selectedCustomer?.lastName || "",
      date: new Date().toISOString().split("T")[0],
      lineItems: [],
      total: 0,
      customerId: selectedCustomer?._id
    }
  )

  // Initialize with at least one line item if none exist
  useEffect(() => {
    if (formData.lineItems.length === 0) {
      setFormData(prev => ({
        ...prev,
        lineItems: [{ itemNumber: "", name: "", amount: 0 }]
      }))
    }
  }, [])

  // Calculate totals when line items change
  useEffect(() => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    const shipping = formData.shipping || 0
    const tax = formData.tax || 0
    const total = subtotal + shipping + tax

    setFormData(prev => ({
      ...prev,
      subtotal,
      total
    }))
  }, [formData.lineItems, formData.shipping, formData.tax])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = formData._id 
      ? `/api/invoices/${formData._id}`
      : "/api/invoices"
      
    const method = formData._id ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save invoice")
      }

      router.push("/dashboard/invoices")
      router.refresh()
    } catch (error) {
      console.error("Error saving invoice:", error)
    }
  }

  const handleLineItemsChange = (lineItems: LineItem[]) => {
    setFormData({ ...formData, lineItems })
  }

  const handleCopyAddress = (checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        billingAddress1: formData.shipAddress1,
        billingAddress2: formData.shipAddress2,
        billingAddress3: formData.shipAddress3,
        billingCity: formData.shipCity,
        billingState: formData.shipState,
        billingZip: formData.shipZip,
        billingCountry: formData.shipCountry,
        copyAddress: true
      })
    } else {
      setFormData({
        ...formData,
        copyAddress: false
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-md shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Invoice</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
            <Mail className="h-4 w-4" /> Email
          </Button>
          <Button type="submit" size="sm" className="flex items-center gap-1">
            <Edit className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Invoice No</label>
            <Input
              value={formData.invoiceNo || ""}
              onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">First Name *</label>
            <Input
              value={formData.customerFirstName}
              onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Last Name</label>
            <Input
              value={formData.customerLastName}
              onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={formData.customerPhone || ""}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.customerEmail || ""}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Ship To Name</label>
            <Input
              value={formData.shipToName || ""}
              onChange={(e) => setFormData({ ...formData, shipToName: e.target.value })}
            />
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Shipping Address</h3>
            <div className="space-y-2">
              <Input
                placeholder="Address Line 1"
                value={formData.shipAddress1 || ""}
                onChange={(e) => setFormData({ ...formData, shipAddress1: e.target.value })}
              />
              <Input
                placeholder="Address Line 2"
                value={formData.shipAddress2 || ""}
                onChange={(e) => setFormData({ ...formData, shipAddress2: e.target.value })}
              />
              <Input
                placeholder="Address Line 3"
                value={formData.shipAddress3 || ""}
                onChange={(e) => setFormData({ ...formData, shipAddress3: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={formData.shipCity || ""}
                  onChange={(e) => setFormData({ ...formData, shipCity: e.target.value })}
                />
                <Input
                  placeholder="State"
                  value={formData.shipState || ""}
                  onChange={(e) => setFormData({ ...formData, shipState: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="ZIP"
                  value={formData.shipZip || ""}
                  onChange={(e) => setFormData({ ...formData, shipZip: e.target.value })}
                />
                <Input
                  placeholder="Country"
                  value={formData.shipCountry || ""}
                  onChange={(e) => setFormData({ ...formData, shipCountry: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Ship Via</label>
            <Select
              value={formData.shipVia || undefined}
              onValueChange={(value) => setFormData({ ...formData, shipVia: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nothing selected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="FedEx">FedEx</SelectItem>
                <SelectItem value="USPS">USPS</SelectItem>
                <SelectItem value="DHL">DHL</SelectItem>
                <SelectItem value="In-Person">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Tracking Number</label>
            <Input
              value={formData.trackingNumber || ""}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
            />
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Sales Person</label>
            <Input
              value={formData.salesPerson || ""}
              onChange={(e) => setFormData({ ...formData, salesPerson: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Method of Sale</label>
            <Select
              value={formData.methodOfSale || undefined}
              onValueChange={(value) => setFormData({ ...formData, methodOfSale: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="In Person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Person">In Person</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Invoice Type</label>
            <Select
              value={formData.invoiceType || undefined}
              onValueChange={(value) => setFormData({ ...formData, invoiceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Consignment">Consignment</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Paid By</label>
            <Select
              value={formData.paidBy || undefined}
              onValueChange={(value) => setFormData({ ...formData, paidBy: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Check" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Auth #</label>
            <Input
              value={formData.authNumber || ""}
              onChange={(e) => setFormData({ ...formData, authNumber: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Shipping</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <Input
                type="number"
                value={formData.shipping || ""}
                onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="taxExempt" 
              checked={formData.taxExempt || false}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, taxExempt: checked as boolean })
              }
            />
            <label htmlFor="taxExempt" className="text-sm font-medium">Tax Exempt</label>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Billing Address</h3>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox 
                id="copyAddress" 
                checked={formData.copyAddress || false}
                onCheckedChange={(checked) => handleCopyAddress(checked as boolean)}
              />
              <label htmlFor="copyAddress" className="text-sm font-medium">Use Shipping Address</label>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Address Line 1"
                value={formData.billingAddress1 || ""}
                onChange={(e) => setFormData({ ...formData, billingAddress1: e.target.value })}
              />
              <Input
                placeholder="Address Line 2"
                value={formData.billingAddress2 || ""}
                onChange={(e) => setFormData({ ...formData, billingAddress2: e.target.value })}
              />
              <Input
                placeholder="Address Line 3"
                value={formData.billingAddress3 || ""}
                onChange={(e) => setFormData({ ...formData, billingAddress3: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={formData.billingCity || ""}
                  onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                />
                <Input
                  placeholder="State"
                  value={formData.billingState || ""}
                  onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="ZIP"
                  value={formData.billingZip || ""}
                  onChange={(e) => setFormData({ ...formData, billingZip: e.target.value })}
                />
                <Input
                  placeholder="Country"
                  value={formData.billingCountry || ""}
                  onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Line Items Section */}
      <div className="p-4">
        <LineItems 
          items={formData.lineItems} 
          onChange={handleLineItemsChange} 
        />
      </div>
      
      {/* Footer */}
      <div className="flex justify-end gap-4 p-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit">
          {formData._id ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  )
}
