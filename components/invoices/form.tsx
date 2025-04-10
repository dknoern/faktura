"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface LineItem {
    itemNumber: string;
    name: string;
}

interface InvoiceFormData {
    _id?: string;
    customerFirstName: string;
    customerLastName: string;
    date: string;
    lineItems: LineItem[];
    trackingNumber: string;
    total: number;
    invoiceType: string;
    customerId?: number;
}

interface Customer {
    _id: number;
    firstName: string;
    lastName: string;
    company?: string;
    email?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
}

export function InvoiceForm({ invoice, selectedCustomer }: { invoice?: InvoiceFormData, selectedCustomer?: Customer }) {
    const router = useRouter();
    const [formData, setFormData] = useState<InvoiceFormData>(
        invoice || {
            customerFirstName: selectedCustomer?.firstName || "",
            customerLastName: selectedCustomer?.lastName || "",
            date: new Date().toISOString().split("T")[0],
            lineItems: [{ itemNumber: "", name: "" }],
            trackingNumber: "",
            total: 0,
            invoiceType: "",
            customerId: selectedCustomer?._id
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = formData._id 
            ? `/api/invoices/${formData._id}`
            : "/api/invoices";
            
        const method = formData._id ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to save invoice");
            }

            router.push("/dashboard/invoices");
            router.refresh();
        } catch (error) {
            console.error("Error saving invoice:", error);
        }
    };

    const handleLineItemChange = (index: number, field: keyof LineItem, value: string) => {
        const newLineItems = [...formData.lineItems];
        newLineItems[index] = {
            ...newLineItems[index],
            [field]: value,
        };
        setFormData({ ...formData, lineItems: newLineItems });
    };

    const addLineItem = () => {
        setFormData({
            ...formData,
            lineItems: [...formData.lineItems, { itemNumber: "", name: "" }],
        });
    };

    const removeLineItem = (index: number) => {
        const newLineItems = formData.lineItems.filter((_, i) => i !== index);
        setFormData({ ...formData, lineItems: newLineItems });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <Input
                        value={formData.customerFirstName}
                        onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <Input
                        value={formData.customerLastName}
                        onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Invoice Type</label>
                    <Input
                        value={formData.invoiceType}
                        onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Line Items</label>
                {formData.lineItems.map((item, index) => (
                    <div key={index} className="flex gap-4 mb-2">
                        <Input
                            placeholder="Item Number"
                            value={item.itemNumber}
                            onChange={(e) => handleLineItemChange(index, "itemNumber", e.target.value)}
                            required
                        />
                        <Input
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => handleLineItemChange(index, "name", e.target.value)}
                            required
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeLineItem(index)}
                            disabled={formData.lineItems.length === 1}
                        >
                            Remove
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addLineItem} className="mt-2">
                    Add Line Item
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Tracking Number</label>
                    <Input
                        value={formData.trackingNumber}
                        onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Total</label>
                    <Input
                        type="number"
                        value={formData.total}
                        onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) })}
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit">
                    {formData._id ? "Update Invoice" : "Create Invoice"}
                </Button>
            </div>
        </form>
    );
}
