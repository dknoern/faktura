"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LineItems, LineItem } from "./line-items"
import { upsertInvoice } from "@/lib/invoiceActions"
import { toast } from "react-hot-toast"

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
  salesPerson: string
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
  address3: string
  billingAddress1: string
  billingAddress2: string
  billingAddress3: string
  billingCity: string
  billingState: string
  billingZip: string
  billingCountry: string
  copyAddress?: boolean
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

export function InvoiceForm({ invoice, selectedCustomer, selectedProduct, salesPerson }: { invoice?: InvoiceFormData, selectedCustomer?: Customer, selectedProduct?: Product, salesPerson?: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionRef = useRef(false)
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
          customerId: selectedCustomer?._id,
          customerFirstName: selectedCustomer?.firstName || "",
          customerLastName: selectedCustomer?.lastName || "",
          shipAddress1: selectedCustomer?.address1 || "",
          shipAddress2: selectedCustomer?.address2 || "",
          shipAddress3: selectedCustomer?.address3 || "",
          shipCity: selectedCustomer?.city || "",
          shipState: selectedCustomer?.state || "",
          shipZip: selectedCustomer?.zip || "",
          shipCountry: "USA",
          billingAddress1: selectedCustomer?.billingAddress1 || "",
          billingAddress2: selectedCustomer?.billingAddress2 || "",
          billingAddress3: selectedCustomer?.billingAddress3 || "",
          billingCity: selectedCustomer?.billingCity || "",
          billingState: selectedCustomer?.billingState || "",
          billingZip: selectedCustomer?.billingZip || "",
          billingCountry: "USA",
          customerEmail: selectedCustomer?.email || "",
          customerPhone: selectedCustomer?.phone || "",
          date: new Date().toISOString(),
          total: selectedProduct?.sellingPrice || 0,
          subtotal: selectedProduct?.sellingPrice || 0,
          tax: 0,
          shipping: 0,
          lineItems: initialLineItems,
          copyAddress: selectedCustomer?.copyAddress || false,
          salesPerson: salesPerson || ""
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

  // Require that all line items have a description and amount, invoice type and sales person are selected before allowing save
  const allItemsValid = formData.lineItems.length > 0 && formData.lineItems.every(item => item.name.trim() !== "");
  const invoiceTypeValid = formData.invoiceType && formData.invoiceType.trim() !== "";
  const salesPersonValid = formData.salesPerson && formData.salesPerson.trim() !== "";
  const canSubmit = allItemsValid && invoiceTypeValid && salesPersonValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission using both state and ref for stronger protection
    if (isSubmitting || submissionRef.current) {
      console.log('Submission blocked - already in progress');
      return;
    }
    
    // Immediately set ref to prevent race conditions
    submissionRef.current = true;
    
    if (!invoiceTypeValid) {
      alert("Please select an invoice type before saving.");
      return;
    }
    
    if (!salesPersonValid) {
      alert("Please enter a sales person before saving.");
      return;
    }
    
    if (!allItemsValid) {
      alert("Please ensure every item has a description and amount.");
      return;
    }

    console.log("setting is submitting ");
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting invoice with ID:', formData._id || 'new');
      
      // Use upsertInvoice for both create and update
      const result = await upsertInvoice(formData, formData._id)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to save invoice")
      }
      
      console.log('Invoice submission successful, redirecting...');
      router.push("/invoices")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save invoice"
      console.error('Invoice submission error:', errorMessage);
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false);
      submissionRef.current = false;
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
              value={formData._id ? formData._id.toString() : (formData.invoiceNo || "")}
              readOnly
              className="bg-gray-50"
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="text"
              readOnly
              className="bg-gray-50"
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
            <label className="text-sm font-medium">Sales Person <span className="text-red-500">*</span></label>
            <Input
              value={formData.salesPerson}
              onChange={(e) => setFormData({ ...formData, salesPerson: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Method of Sale</label>
            <Select
              value={formData.methodOfSale || undefined}
              onValueChange={(value) => setFormData({ ...formData, methodOfSale: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Select Method of Sale --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Show">Show</SelectItem>
                <SelectItem value="Ebay">Ebay</SelectItem>
                <SelectItem value="Chrono24">Chrono24</SelectItem>
                <SelectItem value="In Person">In Person</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="First Dibs">First Dibs</SelectItem>
                <SelectItem value="Dealer">Dealer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Invoice Type <span className="text-red-500">*</span></label>
            <Select
              value={formData.invoiceType || undefined}
              onValueChange={(value) => setFormData({ ...formData, invoiceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Select Invoice Type --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Memo">Memo</SelectItem>
                <SelectItem value="Estimate">Estimate</SelectItem>
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
                <SelectValue placeholder="-- Select Paid By --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Paypal">Paypal</SelectItem>
                <SelectItem value="Bank Wire">Bank Wire</SelectItem>
                <SelectItem value="Chrono 24">Chrono 24</SelectItem>
                <SelectItem value="Warranty">Warranty</SelectItem>
                <SelectItem value="Affirm">Affirm</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? (formData._id ? "Updating..." : "Creating...") : (formData._id ? "Update Invoice" : "Create Invoice")}
        </Button>
      </div>
    </form>
  )
}
