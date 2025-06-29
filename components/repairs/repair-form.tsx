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
import { searchAvailableProducts } from "@/app/actions/repair-products";

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
    repairNumber: string;
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
  const [warrantyService, setWarrantyService] = useState(repair?.warrantyService || false);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  if (initialSelectedProduct !== null && selectedProduct === null) {
    setSelectedProduct(initialSelectedProduct);
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Add checkbox values that might not be in the form if unchecked
      if (!customerApproved) {
        formData.set('customerApprovedDate', '');
      }

      // Set warranty service value
      formData.set('warrantyService', warrantyService ? 'true' : 'false');

      if (repair) {
        await updateRepair(repair.repairNumber, formData);
      } else if (selectedProduct) {
        // add hidden form elements for productId and customerId
        formData.set('productId', selectedProduct?._id || initialSelectedProduct?._id || '');

        if (selectedCustomer) {
          const customerId = selectedCustomer._id;
          formData.set('customerId', customerId.toString());
        }

        await createRepair(formData);
      }
      router.push("/repairs");
      router.refresh();
    } catch (error) {
      console.error("Error saving repair:", error);
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
            defaultValue={initialSelectedProduct?.itemNumber || repair?.repairNumber}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            name="vendor"
            defaultValue={repair?.vendor}
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
            if (checked && repair && !repair?.customerApprovedDate) {
              repair.customerApprovedDate = new Date().toISOString();
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
            defaultValue={repair?.customerApprovedDate?.split("T")[0] || ""}
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
          defaultValue={repair?.repairIssues || ''}
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
              className="rounded-r-none"
            />
            <Button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="rounded-l-none"
            >
              Select
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          name="description"
          defaultValue={selectedProduct?.title || repair?.description || ''}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="repairNotes">Repair Notes</Label>
        <Textarea
          id="repairNotes"
          name="repairNotes"
          rows={4}
          defaultValue={repair?.repairNotes || ''}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerFirstName">Customer First Name *</Label>
          <Input
            id="customerFirstName"
            name="customerFirstName"
            defaultValue={repair?.customerFirstName || selectedCustomer?.firstName || ''}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerLastName">Customer Last Name *</Label>
          <Input
            id="customerLastName"
            name="customerLastName"
            defaultValue={repair?.customerLastName || selectedCustomer?.lastName || ''}
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
            defaultValue={repair?.phone || selectedCustomer?.phone || ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Customer Email</Label>
          <Input
            id="email"
            name="email"
            defaultValue={repair?.email || selectedCustomer?.email || ''}
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
            defaultValue={repair?.repairCost || ''}
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
        customSearchFunction={searchAvailableProducts}
        modalTitle="Select Available Product"
      />
    </form>
    
  );
} 