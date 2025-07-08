"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

export interface ProposalLineItem {
  name: string
  longDesc: string
  amount: number
}

interface ProposalLineItemsProps {
  items: ProposalLineItem[]
  onChange: (items: ProposalLineItem[]) => void
}

export function ProposalLineItems({ items, onChange }: ProposalLineItemsProps) {
  const handleLineItemChange = (index: number, field: keyof ProposalLineItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    onChange(newItems)
  }

  const addLineItem = () => {
    onChange([...items, { name: "", longDesc: "", amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Line Items</h3>
        <Button 
          type="button" 
          size="sm" 
          variant="default" 
          onClick={addLineItem}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">Description</th>
              <th className="text-left p-2 border w-[110px]">Amount</th>
              <th className="w-[80px]"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2 border">
                  <Input
                    value={item.name}
                    onChange={(e) => handleLineItemChange(index, "name", e.target.value)}
                    placeholder="Item name"
                  />
                </td>
                <td className="p-2 border">
                  <Textarea
                    value={item.longDesc}
                    onChange={(e) => handleLineItemChange(index, "longDesc", e.target.value)}
                    placeholder="Item description"
                    className="min-h-[72px] resize-none"
                    rows={3}
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
          <div className="flex justify-between pt-2 border-t">
            <span className="font-bold">Total:</span>
            <span className="font-bold">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
