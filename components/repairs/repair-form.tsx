"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createRepair, updateRepair } from "@/lib/actions";
import { ProductSelectModal } from "@/components/invoices/product-select-modal";
import { toast } from "react-hot-toast";

interface Product {
  _id: string;
  itemNumber: string;
  title: string;
  sellingPrice?: number;
  serialNo?: string;
  longDesc?: string;
}

interface RepairFormProps {
  repair?: {
    repairNumber: string | null;
    itemNumber: string;
    description: string;
    dateOut: string | null;
    customerApprovedDate: string | null;
    returnDate: string | null;
    customerFirstName: string;
    customerLastName: string;
    vendor: string;
    repairCost: number;
    repairIssues?: string;
    repairNotes?: string;
    warrantyService?: boolean;
    email?: string;
    phone?: string;
  };
  selectedCustomer?: {
    _id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
  } | null;

  initialSelectedProduct: Product | null;
}

export function RepairForm({ repair, selectedCustomer, initialSelectedProduct }: RepairFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerApproved, setCustomerApproved] = useState(!!repair?.customerApprovedDate);
  const [customerApprovedDate, setCustomerApprovedDate] = useState(repair?.customerApprovedDate || '');
  const [warrantyService, setWarrantyService] = useState(repair?.warrantyService || false);
  const [repairNumber, setRepairNumber] = useState(initialSelectedProduct?.itemNumber || repair?.repairNumber || '');
  
  // Add state for all form fields to retain values on error
  const [vendor, setVendor] = useState(repair?.vendor || '');
  const [description, setDescription] = useState(selectedProduct?.title || repair?.description || '');
  const [repairIssues, setRepairIssues] = useState(repair?.repairIssues || '');
  const [repairNotes, setRepairNotes] = useState(repair?.repairNotes || '');
  const [customerFirstName, setCustomerFirstName] = useState(repair?.customerFirstName || selectedCustomer?.firstName || '');
  const [customerLastName, setCustomerLastName] = useState(repair?.customerLastName || selectedCustomer?.lastName || '');
  const [phone, setPhone] = useState(repair?.phone || selectedCustomer?.phone || '');
  const [email, setEmail] = useState(repair?.email || selectedCustomer?.email || '');
  const [repairCost, setRepairCost] = useState(repair?.repairCost?.toString() || '');

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    // Update repair number with the selected product's item number
    if (product.itemNumber) {
      setRepairNumber(product.itemNumber);
    }
    // Update description when product is selected
    if (product.title) {
      setDescription(product.title);
    }
  };

  if (initialSelectedProduct !== null && selectedProduct === null) {
    setSelectedProduct(initialSelectedProduct);
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Add checkbox values that might not be in the form if unchecked
      if (customerApproved && customerApprovedDate) {
        formData.set('customerApprovedDate', customerApprovedDate);
      } else {
        formData.set('customerApprovedDate', '');
      }

      // Set warranty service value
      formData.set('warrantyService', warrantyService ? 'true' : 'false');

      if (repair) {
        await updateRepair(repair.repairNumber!, formData);
        router.push("/repairs");
        router.refresh();
      } else {
        // add hidden form elements for productId and customerId
        formData.set('productId', selectedProduct?._id || initialSelectedProduct?._id || '');

        if (selectedCustomer) {
          const customerId = selectedCustomer._id;
          formData.set('customerId', customerId.toString());
        }

        const result = await createRepair(formData);
        
        if (result.success === false) {
          toast.error(result.error || "An error occurred while creating the repair.");
          return; // Don't navigate away if there's an error
        }
        
        router.push("/repairs");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving repair:", error);
      toast.error("An unexpected error occurred while saving the repair.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <form action={handleSubmit} className="space-y-4">

      {/* Hidden form elements for product and customer IDs */}
      <input 
        type="hidden" 
        name="selectedProductId" 
        defaultValue={selectedProduct?._id || initialSelectedProduct?._id || ''} 
      />
      <input 
        type="hidden" 
        name="selectedCustomerId" 
        defaultValue={selectedCustomer?._id.toString() || ''} 
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="repairNumber">Repair No *</Label>
          <Input
            id="repairNumber"
            name="repairNumber"
            value={repairNumber}
            onChange={(e) => setRepairNumber(e.target.value)}
            placeholder={repair ? undefined : "Enter or leave blank to auto-generate"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor *</Label>
          <Input
            id="vendor"
            name="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOut">Date Out</Label>
        <Input
          id="dateOut"
          name="dateOut"
          type="text"
          defaultValue={repair?.dateOut?.split("T")[0] || new Date().toISOString().split("T")[0]}
          readOnly 
          className="cursor-not-allowed bg-gray-100"
        />
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Checkbox
          id="customerApproved"
          checked={customerApproved}
          onCheckedChange={(checked) => {
            setCustomerApproved(checked as boolean);
            if (checked) {
              // Set current date when checkbox is checked
              const currentDate = new Date().toISOString();
              setCustomerApprovedDate(currentDate);
              // Also update the repair object if it exists (for editing)
              if (repair && !repair?.customerApprovedDate) {
                repair.customerApprovedDate = currentDate;
              }
            } else {
              // Clear date when unchecked
              setCustomerApprovedDate('');
              if (repair) {
                repair.customerApprovedDate = null;
              }
            }
          }}
        />
        <Label htmlFor="customerApproved" className="cursor-pointer">Customer Approved</Label>
      </div>

      <div className="space-y-2">
          <Label htmlFor="customerApprovedDate">Customer Approved Date</Label>
          <Input
            id="customerApprovedDate"
            name="customerApprovedDate"
            value={customerApprovedDate ? customerApprovedDate.split("T")[0] : ""}
            type="text"
            readOnly
            className="cursor-not-allowed bg-gray-100"
          />
        </div>

      <div className="space-y-2">
        <Label htmlFor="returnDate">Return Date</Label>
        <Input
          id="returnDate"
          name="returnDate"
          type="text"
          defaultValue={repair?.returnDate?.split("T")[0] || ""}
          readOnly
          className="cursor-not-allowed bg-gray-100"
        />
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Checkbox
          id="warrantyService"
          checked={warrantyService}
          onCheckedChange={(checked) => setWarrantyService(checked as boolean)}
          name="warrantyService"
        />
        <Label htmlFor="warrantyService" className="cursor-pointer">Warranty Service</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repairIssues">Repair Issues</Label>
        <Textarea
          id="repairIssues"
          name="repairIssues"
          rows={4}
          value={repairIssues}
          onChange={(e) => setRepairIssues(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemNumber">Item No</Label>
          <div className="flex">
            <Input
              id="itemNumber"
              name="itemNumber"
              value={selectedProduct?.itemNumber || repair?.itemNumber || ''}
              readOnly
              className={repair ? "cursor-not-allowed bg-gray-100" : "rounded-r-none"}
            />
            {!repair && (
              <Button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="rounded-l-none"
              >
                Select
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="repairNotes">Repair Notes</Label>
        <Textarea
          id="repairNotes"
          name="repairNotes"
          rows={4}
          value={repairNotes}
          onChange={(e) => setRepairNotes(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerFirstName">Customer First Name *</Label>
          <Input
            id="customerFirstName"
            name="customerFirstName"
            value={customerFirstName}
            onChange={(e) => setCustomerFirstName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerLastName">Customer Last Name *</Label>
          <Input
            id="customerLastName"
            name="customerLastName"
            value={customerLastName}
            onChange={(e) => setCustomerLastName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Customer Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Customer Email</Label>
          <Input
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repairCost">Repair Cost</Label>
        <div className="flex">
          <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
            $
          </span>
          <Input
            id="repairCost"
            name="repairCost"
            type="number"
            step="0.01"
            value={repairCost}
            onChange={(e) => setRepairCost(e.target.value)}
            className="rounded-l-none"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : repair ? "Update Repair" : "Create Repair"}
        </Button>
      </div>

      {/* Product Selection Modal */}
      <ProductSelectModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductSelect={handleProductSelect}
        statuses={["In Stock", "Sold", "Memo", "Partnership"]}
      />
    </form>
    
  );
} 