"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LineItems, LineItem } from "./line-items"
import { upsertInvoice } from "@/lib/invoiceActions"

const formatDateTime = (input: string) => {
  const dateObj = new Date(input);
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy} ${hh}:${min}`;
};

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

interface Product {
  _id: string
  itemNumber: string
  title: string
  sellingPrice?: number
  serialNo?: string
  longDesc?: string
}

export function InvoiceForm({ invoice, selectedCustomer, selectedProduct }: { invoice?: InvoiceFormData, selectedCustomer?: Customer, selectedProduct?: Product }) {
  const router = useRouter()
  // Create initial line items if a product is selected
  const initialLineItems = selectedProduct ? [
    {
      productId: selectedProduct._id,
      itemNumber: selectedProduct.itemNumber || '',
      name: selectedProduct.title || '',
      amount: selectedProduct.sellingPrice || 0,
      serialNumber: selectedProduct.serialNo || '',
      longDesc: selectedProduct.longDesc || ''
    }
  ] : [];

  const [formData, setFormData] = useState<InvoiceFormData>(
    invoice
      ? { ...invoice, date: formatDateTime(invoice.date) }
      : {
          customerFirstName: selectedCustomer?.firstName || "",
          customerLastName: selectedCustomer?.lastName || "",
          shipAddress1: selectedCustomer?.address1 || "",
          shipAddress2: selectedCustomer?.address2 || "",
          shipAddress3: "",
          shipCity: selectedCustomer?.city || "",
          shipState: selectedCustomer?.state || "",
          shipZip: selectedCustomer?.zip || "",
          shipCountry: "USA",
          customerEmail: selectedCustomer?.email || "",
          customerPhone: selectedCustomer?.phone || "",
          date: new Date().toISOString(),
          total: selectedProduct?.sellingPrice || 0,
          subtotal: selectedProduct?.sellingPrice || 0,
          tax: 0,
          shipping: 0,
          lineItems: initialLineItems,
          copyAddress: false,
          invoiceType: "Invoice"
        }
  )

  // Initialize with at least one line item if none exist
  useEffect(() => {
    if (formData.lineItems.length === 0) {
      setFormData(prev => ({
        ...prev,
        lineItems: []
      }))
    }
  }, [formData.lineItems.length])

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

  // Require that all line items have a description and amount before allowing save
  const allItemsValid = formData.lineItems.length > 0 && formData.lineItems.every(item => item.name.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allItemsValid) {
      alert("Please ensure every item has a description and amount.");
      return;
    }
    
    try {
      
      // Use upsertInvoice for both create and update
      const result = await upsertInvoice(formData, formData._id)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to save invoice")
      }
      
      router.push("/invoices")
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
              type="text"
              readOnly
              value={formData.date}
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
            <Input
              value={formData.customerFirstName}
              onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
            <Input
              value={formData.customerLastName}
              onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
              required
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
            <h3 className="font-medium mb-2">Shipping Address  <span className="text-red-500">*</span></h3>
            <div className="space-y-2">
              <Input
                placeholder="Address Line 1"
                required
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
                  required
                  value={formData.shipCity || ""}
                  onChange={(e) => setFormData({ ...formData, shipCity: e.target.value })}
                />
                <Input
                  placeholder="State"
                  required
                  value={formData.shipState || ""}
                  onChange={(e) => setFormData({ ...formData, shipState: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="ZIP"
                  required
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
            <label className="text-sm font-medium">Invoice Type <span className="text-red-500">*</span></label>
            <Select
              value={formData.invoiceType || "Invoice"}
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
          shipping={formData.shipping || 0}
          tax={formData.tax || 0}
          onChange={handleLineItemsChange} 
        />
      </div>
      
      {/* Footer */}
      <div className="flex justify-end gap-4 p-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!allItemsValid}>
          {formData._id ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  )
}
