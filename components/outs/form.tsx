"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignaturePad } from "@/components/ui/signature-pad";

interface OutItem {
    _id?: string;
    itemNumber: string;
    name: string;
    date: string;
    sentTo: string;
    description: string;
    sentBy: string;
    comments: string;
    customerFirstName: string;
    customerLastName: string;
    vendor: string;
    signature?: string;
    signatureDate?: string;
    signatureUser?: string;
}

export function OutForm({ out }: { out?: OutItem }) {
    const router = useRouter();
    const [formData, setFormData] = useState<OutItem>(
        out || {
            itemNumber: "",
            name: "",
            date: new Date().toISOString().split("T")[0],
            sentTo: "",
            description: "",
            sentBy: "",
            comments: "",
            customerFirstName: "",
            customerLastName: "",
            vendor: "",
            signature: "",
            signatureDate: "",
            signatureUser: ""
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = formData._id 
            ? `/api/outs/${formData._id}`
            : "/api/outs";
            
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
                throw new Error("Failed to save out item");
            }

            router.push("/dashboard/logoutitems");
            router.refresh();
        } catch (error) {
            console.error("Error saving out item:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Item Number</label>
                    <Input
                        value={formData.itemNumber}
                        onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Sent To</label>
                    <Input
                        value={formData.sentTo}
                        onChange={(e) => setFormData({ ...formData, sentTo: e.target.value })}
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
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Sent By</label>
                    <Input
                        value={formData.sentBy}
                        onChange={(e) => setFormData({ ...formData, sentBy: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Comments</label>
                    <Input
                        value={formData.comments}
                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                        required
                    />
                </div>
            </div>

            {formData.signature && (
                <div className="mt-6 border rounded-md p-4 bg-gray-50">
                    <h3 className="text-sm font-medium mb-2">Signature</h3>
                    <div className="bg-white border rounded-md p-2 inline-block">
                        <img src={formData.signature} alt="Signature" className="h-16 object-contain" />
                    </div>
                    {formData.signatureDate && (
                        <p className="text-xs text-gray-500 mt-2">
                            Signed by {formData.signatureUser} on {new Date(formData.signatureDate).toLocaleDateString()}
                        </p>
                    )}
                </div>
            )}

            <div className="mt-6">
                <SignaturePad
                    value={formData.signature}
                    onChange={(signature) => setFormData({
                        ...formData,
                        signature,
                        signatureDate: new Date().toISOString(),
                        signatureUser: formData.sentBy || "User"
                    })}
                    label="eSignature (optional)"
                />
            </div>

            <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit">
                    {formData._id ? "Update Item" : "Create Item"}
                </Button>
            </div>
        </form>
    );
}
