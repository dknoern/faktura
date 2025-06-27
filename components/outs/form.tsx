"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SignaturePad } from "@/components/ui/signature-pad";
import { format } from "date-fns";
import { Textarea } from "../ui/textarea";

interface OutItem {
    _id?: string;
    name: string;
    date: string;
    sentTo: string;
    description: string;
    user: string;
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
    const [formData, setFormData] = useState<OutItem>(() => {
        const defaultData = {
            name: "",
            date: new Date().toISOString().split("T")[0],
            sentTo: "",
            description: "",
            user: "",
            comments: "",
            customerFirstName: "",
            customerLastName: "",
            vendor: "",
            signature: "",
            signatureDate: "",
            signatureUser: ""
        };

        if (out) {
            return {
                ...defaultData,
                ...out,
                // Ensure optional fields are strings, not undefined
                signature: out.signature || "",
                signatureDate: out.signatureDate || "",
                signatureUser: out.signatureUser || ""
            };
        }

        return defaultData;
    });

    useEffect(() => {
        const fetchCurrentUser = async () => {
            // Only set default user if user is empty (new item)
            if (formData.user || formData._id) return;

            try {
                const response = await fetch("/api/user");
                if (!response.ok) {
                    throw new Error("Failed to fetch current user");
                }
                const data = await response.json();
                setFormData(prev => ({ ...prev, user: data.username }));
            } catch (error) {
                console.error("Error fetching current user:", error);
            }
        };
        fetchCurrentUser();
    }, [formData.user, formData._id]);

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
                {formData._id && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <Input
                            type="text"
                            value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd") : ""}
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                        />
                    </div>
                )}

            </div>
            <div className="grid grid-cols-2 gap-4">
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
                        value={formData.user}
                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}

                    />
                </div>

            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Note/Comment</label>
                    <Textarea rows={4}
                        value={formData.comments}
                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit">
                    {formData._id ? "Update Item" : "Create Item"}
                </Button>
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

            {formData._id && (
                <div className="mt-6">
                    <SignaturePad
                        value={formData.signature}
                        onChange={(signature) => setFormData({
                            ...formData,
                            signature,
                            signatureDate: new Date().toISOString(),
                            signatureUser: formData.user || "User"
                        })}
                        label="eSignature (optional)"
                    />
                </div>
            )}

        </form>
    );
}
