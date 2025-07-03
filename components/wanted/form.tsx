"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";

interface Wanted {
  _id?: string;
  title: string;
  description: string;
  customerName: string;
  customerId: number;
  createdDate?: string;
  foundDate?: string | null;
  createdBy?: string;
  foundBy?: string;
}

interface Customer {
  _id: string;
  customerId?: number;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

interface WantedFormProps {
  wanted?: Wanted;
  isEditing?: boolean;
  selectedCustomer?: Customer;
}

export function WantedForm({ wanted, isEditing = false, selectedCustomer }: WantedFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Wanted>(() => {
    // Initialize with customer data if provided
    let customerName = "";
    let customerId = 0;
    
    if (selectedCustomer && !isEditing) {
      if (selectedCustomer.firstName || selectedCustomer.lastName) {
        customerName = `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim();
      } else if (selectedCustomer.companyName) {
        customerName = selectedCustomer.companyName;
      }
      customerId = selectedCustomer.customerId || parseInt(selectedCustomer._id) || 0;
    }
    
    return {
      title: wanted?.title || "",
      description: wanted?.description || "",
      customerName: wanted?.customerName || customerName,
      customerId: wanted?.customerId || customerId,
    };
  });
  




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (!formData.customerName.trim()) {
      toast.error("Customer is required");
      return;
    }

    setIsLoading(true);
    
    try {
      const url = isEditing ? `/api/wanted/${wanted?._id}` : '/api/wanted';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(isEditing ? "Wanted item updated!" : "Wanted item created!");
        router.push(`/wanted/${result._id}/view`);
      } else {
        toast.error("Failed to save wanted item");
      }
    } catch (error) {
      console.error('Error saving wanted item:', error);
      toast.error("Failed to save wanted item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && wanted?._id) {
      router.push(`/wanted/${wanted._id}/view`);
    } else {
      router.push('/wanted');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Wanted Item' : 'New Wanted Item'}
        </h1>
      </div>


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter item title"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
                {selectedCustomer && !isEditing && (
                  <span className="text-xs text-green-600 ml-2">(Pre-selected)</span>
                )}
              </label>
              <Input
                id="customerName"
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
                required
                className={selectedCustomer && !isEditing ? "border-green-200 bg-green-50" : ""}
              />
              {selectedCustomer && !isEditing && (
                <p className="text-xs text-green-600 mt-1">
                  Customer was pre-selected from your selection. You can still edit this field if needed.
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4 justify-end">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
    </div>
  );
}
