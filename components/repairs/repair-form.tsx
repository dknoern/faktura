"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRepair, updateRepair } from "@/lib/actions";

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
  };
  selectedCustomer?: {
    _id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
  } | null;
}

export function RepairForm({ repair, selectedCustomer }: RepairFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (repair) {
        await updateRepair(repair.repairNumber, formData);
      } else {
        await createRepair(formData);
      }
      router.push("/dashboard/repairs");
      router.refresh();
    } catch (error) {
      console.error("Error saving repair:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="repairNumber">Repair Number</Label>
          <Input
            id="repairNumber"
            name="repairNumber"
            defaultValue={repair?.repairNumber}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemNumber">Item Number</Label>
          <Input
            id="itemNumber"
            name="itemNumber"
            defaultValue={repair?.itemNumber}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={repair?.description}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOut">Date Out</Label>
          <Input
            id="dateOut"
            name="dateOut"
            type="date"
            defaultValue={repair?.dateOut?.split("T")[0]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerApprovedDate">Customer Approved Date</Label>
          <Input
            id="customerApprovedDate"
            name="customerApprovedDate"
            type="date"
            defaultValue={repair?.customerApprovedDate?.split("T")[0]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="returnDate">Return Date</Label>
          <Input
            id="returnDate"
            name="returnDate"
            type="date"
            defaultValue={repair?.returnDate?.split("T")[0]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerFirstName">Customer First Name</Label>
          <Input
            id="customerFirstName"
            name="customerFirstName"
            defaultValue={repair?.customerFirstName || selectedCustomer?.firstName || ''}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerLastName">Customer Last Name</Label>
          <Input
            id="customerLastName"
            name="customerLastName"
            defaultValue={repair?.customerLastName || selectedCustomer?.lastName || ''}
            required
          />
        </div>
      </div>
      
      {/* Additional customer fields if available */}
      {selectedCustomer && (
        <div className="grid grid-cols-2 gap-4">
          {selectedCustomer.email && (
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                defaultValue={selectedCustomer.email}
                readOnly
              />
            </div>
          )}
          {selectedCustomer.phone && (
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                defaultValue={selectedCustomer.phone}
                readOnly
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            name="vendor"
            defaultValue={repair?.vendor}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="repairCost">Repair Cost</Label>
          <Input
            id="repairCost"
            name="repairCost"
            type="number"
            step="0.01"
            defaultValue={repair?.repairCost}
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/repairs")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : repair ? "Update Repair" : "Create Repair"}
        </Button>
      </div>
    </form>
  );
} 