"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ProductSelectModal } from "./product-select-modal"
import { Plus, Trash2 } from "lucide-react"
import { searchFilteredStatusProducts } from "@/app/actions/inventory"

export interface LineItem {
  productId?: string
  itemNumber: string
  name: string
  amount: number
  serialNumber?: string
  longDesc?: string
}

interface LineItemsProps {
  items: LineItem[],
  shipping: number,
  tax: number,
  onChange: (items: LineItem[]) => void
}


export function LineItems({ items, shipping, tax, onChange }: LineItemsProps) {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null)
  const [isAddingNewItem, setIsAddingNewItem] = useState(false)

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    onChange(newItems)
  }

  const addLineItem = () => {
    // Instead of immediately adding a line item, open the product modal first
    setIsAddingNewItem(true)
    setIsProductModalOpen(true)
  }

  const addMiscItem = () => {
    // For misc items, keep the original behavior
    onChange([...items, { itemNumber: "MISC", name: "", amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }


  const handleProductSelect = (product: any) => {
    const newLineItem = {
      productId: product._id,
      itemNumber: product.itemNumber,
      name: product.title,
      amount: product.sellingPrice || 0,
      serialNumber: product.serialNo || "",
      longDesc: product.longDesc || ""
    }
    
    if (isAddingNewItem) {
      // Adding a new line item
      onChange([...items, newLineItem])
    } else if (currentEditIndex !== null) {
      // Editing an existing line item
      const newItems = [...items]
      newItems[currentEditIndex] = newLineItem
      onChange(newItems)
    }
  }
  
  const handleModalClose = () => {
    setIsProductModalOpen(false)
    // Reset state
    setCurrentEditIndex(null)
    setIsAddingNewItem(false)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Line Items</h3>
        <div className="flex gap-2">
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            onClick={addMiscItem}
          >
            Add Misc Item
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="default" 
            onClick={addLineItem}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Line Item
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Description</th>
              <th className="text-left p-2 border w-[110px]">Item No</th>
              <th className="text-left p-2 border w-[110px]">Serial No</th>
              <th className="text-left p-2 border w-[110px]">Amount</th>
              <th className="w-[80px]"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2 border">
                  <div className="space-y-2">
                    <Textarea
                      value={item.name}
                      onChange={(e) => handleLineItemChange(index, "name", e.target.value)}
                      placeholder="Name/Title"
                      className="min-h-[48px] resize-none"
                      rows={2}
                    />
                    <Textarea
                      value={item.longDesc || ""}
                      onChange={(e) => handleLineItemChange(index, "longDesc", e.target.value)}
                      placeholder="Long Description"
                      className="min-h-[72px] resize-none"
                      rows={3}
                    />
                  </div>
                </td>
                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.itemNumber}
                      onChange={(e) => handleLineItemChange(index, "itemNumber", e.target.value)}
                      placeholder="Item #"
                    />
                  </div>
                </td>
                <td className="p-2 border">
                  <Input
                    value={item.serialNumber || ""}
                    onChange={(e) => handleLineItemChange(index, "serialNumber", e.target.value)}
                    placeholder="Serial #"
                  />
                </td>
                <td className="p-2 border">
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <Input
                      type="number"
                      value={item.amount || ""}
                      onChange={(e) => handleLineItemChange(index, "amount", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </td>
                <td className="p-2 border text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-[300px] space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Shipping:</span>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <Input 
                type="number" 
                className="w-[100px]" 
                placeholder="0.00"
                value={shipping}
                readOnly
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Tax:</span>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <Input 
                type="number" 
                className="w-[100px]" 
                placeholder="0.00"
                value={tax}
                readOnly
              />
            </div>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-bold">Total:</span>
            <span className="font-bold">${calculateSubtotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <ProductSelectModal
        isOpen={isProductModalOpen}
        onClose={handleModalClose}
        onProductSelect={handleProductSelect}
        modalTitle="Select Product (In Stock)"
        customSearchFunction={(search) => searchFilteredStatusProducts(search, ["In Stock"])}
      />
    </div>
  )
}
