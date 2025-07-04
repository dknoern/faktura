"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { createReturn, updateReturn } from "@/lib/actions";

interface LineItem {
  productId?: string;
  itemNumber: string;
  name?: string;
  amount: number;
  serialNo?: string;
  longDesc?: string;
  included: boolean;
}

interface ReturnData {
  _id?: number;
  customerName: string;
  customerId?: number;
  invoiceId: string;
  returnDate: string;
  subTotal: number;
  taxable: boolean;
  salesTax: number;
  shipping: number;
  totalReturnAmount: number;
  salesPerson?: string;
  lineItems: LineItem[];
}

interface ReturnFormProps {
  initialData?: ReturnData;
}

export default function ReturnForm({ initialData }: ReturnFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  
  const defaultData: ReturnData = {
    customerName: "",
    invoiceId: "",
    returnDate: new Date().toISOString().split('T')[0],
    subTotal: 0,
    taxable: false,
    salesTax: 0,
    shipping: 0,
    totalReturnAmount: 0,
    lineItems: []
  };

  const [formData, setFormData] = useState<ReturnData>(initialData || defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals whenever relevant form fields change
  useEffect(() => {
    // Calculate subtotal from line items that are included
    const subTotal = formData.lineItems.reduce((total, item) => {
      return total + (item.included ? (item.amount || 0) : 0);
    }, 0);

    // Calculate sales tax if taxable
    const salesTax = formData.taxable ? subTotal * 0.0825 : 0; // Assuming 8.25% tax rate
    
    // Calculate total
    const totalReturnAmount = subTotal + salesTax + (formData.shipping || 0);

    // Only update if values have actually changed to prevent infinite loops
    if (formData.subTotal !== subTotal || formData.salesTax !== salesTax || formData.totalReturnAmount !== totalReturnAmount) {
      setFormData(prev => ({
        ...prev,
        subTotal,
        salesTax,
        totalReturnAmount
      }));
    }
  }, [formData.lineItems, formData.shipping, formData.taxable, formData.subTotal, formData.salesTax, formData.totalReturnAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate totals
    const subTotal = updatedItems.reduce((total, item) => {
      return total + (item.included ? item.amount : 0);
    }, 0);
    const salesTax = formData.taxable ? subTotal * 0.0825 : 0;
    const totalReturnAmount = subTotal + salesTax + (formData.shipping || 0);

    // Update the state with the new values
    setFormData(prev => ({
      ...prev,
      lineItems: updatedItems,
      subTotal: subTotal,
      salesTax: salesTax,
      totalReturnAmount: totalReturnAmount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let result;
      
      if (isEditing && formData._id) {
        // Update existing return using server action
        result = await updateReturn(formData._id, formData);
      } else {
        // Create new return using server action
        result = await createReturn(formData);
      }

      if (!result.success) {
        throw new Error('Failed to save return');
      }

      toast.success(`Return ${isEditing ? 'updated' : 'created'} successfully`);
      router.push('/returns');
      router.refresh();
    } catch (error) {
      console.error('Error saving return:', error);
      toast.error('Failed to save return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="returnId">Return No</Label>
          <Input
            id="returnId"
            name="_id"
            value={formData._id || ''}
            onChange={handleNumberInputChange}
            readOnly={isEditing}
            disabled
          />
        </div>
        
        <div>
          <Label htmlFor="invoiceId">Invoice No</Label>
          <Input
            id="invoiceId"
            name="invoiceId"
            value={formData.invoiceId || ''}
            onChange={handleInputChange}
            disabled
          />
        </div>
        
        <div>
          <Label htmlFor="returnDate">Date</Label>
          <Input
            id="returnDate"
            name="returnDate"
            type="text"
            value={formData.returnDate?.split('T')[0] || ''}
            onChange={handleInputChange}
            disabled
          />
        </div>
        
        <div>
          <Label htmlFor="customerName">Customer</Label>
          <Input
            id="customerName"
            name="customerName"
            value={formData.customerName || ''}
            onChange={handleInputChange}
          />
        </div>
        
        <div>
          <Label htmlFor="shipping">Shipping</Label>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <Input
              id="shipping"
              name="shipping"
              type="number"
              step="0.01"
              value={formData.shipping || 0}
              onChange={handleNumberInputChange}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-8">
          <Checkbox
            id="taxable"
            name="taxable"
            checked={formData.taxable || false}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, taxable: checked === true }))
            }
          />
          <Label htmlFor="taxable">Taxable</Label>
        </div>
      </div>
      
      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold">Line Items</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Item Number</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Included</th>
            </tr>
          </thead>
          <tbody>
            {formData.lineItems && formData.lineItems.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-2">
                  <Input
                    value={item.name || ''}
                    onChange={(e) => handleLineItemChange(index, 'longDesc', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={item.itemNumber || ''}
                    onChange={(e) => handleLineItemChange(index, 'itemNumber', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center">
                    <span className="mr-2">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.amount || 0}
                      onChange={(e) => handleLineItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </td>
                <td className="p-2 text-center">
                  <Checkbox
                    checked={item.included || false}
                    onCheckedChange={formData._id ? undefined : (checked) => 
                      handleLineItemChange(index, 'included', checked === true)
                    }
                    disabled={!!formData._id}
                  />
                </td>
              </tr>
            ))}
            {(!formData.lineItems || formData.lineItems.length === 0) && (
              <tr className="border-b border-gray-200">
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No items added yet
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={2} className="p-2 text-right font-medium">Subtotal</td>
              <td className="p-2">${formData.subTotal?.toFixed(2) || '0.00'}</td>
              <td></td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={2} className="p-2 text-right font-medium">Shipping</td>
              <td className="p-2">${formData.shipping?.toFixed(2) || '0.00'}</td>
              <td></td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={2} className="p-2 text-right font-medium">Tax (TX)</td>
              <td className="p-2">${formData.salesTax?.toFixed(2) || '0.00'}</td>
              <td></td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={2} className="p-2 text-right font-semibold">Total</td>
              <td className="p-2 font-semibold">${formData.totalReturnAmount?.toFixed(2) || '0.00'}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="flex justify-end mt-8 space-x-4">
      <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>        
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          Save
        </Button>

      </div>
    </form>
  );
}
