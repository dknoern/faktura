"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

}

export function OutForm({ out }: { out?: OutItem }) {
    const router = useRouter();
    const [formData, setFormData] = useState<OutItem>(() => {
        const defaultData = {
            name: "",
            date: new Date().toISOString(), // Keep full date/time instead of just date
            sentTo: "",
            description: "",
            user: "",
            comments: "",
            customerFirstName: "",
            customerLastName: "",
            vendor: "",

        };

        if (out) {
            return {
                ...defaultData,
                ...out,

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

            router.push("/logoutitems");
            router.refresh();
        } catch (error) {
            console.error("Error saving out item:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">


            <div className="grid ">
                {formData._id && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <Input
                            type="text"
                            value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd HH:mm:ss") : ""}
                            readOnly
                            className="bg-gray-50 cursor-not-allowed"
                        />
                    </div>
                )}

            </div>
            <div className="grid ">
                <div>
                    <label className="block text-sm font-medium mb-1">Sent To</label>
                    <Input
                        value={formData.sentTo}
                        onChange={(e) => setFormData({ ...formData, sentTo: e.target.value })}
                        required
                    />
                </div>
            </div>


            <div className="grid">
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
            </div>
            <div className="grid">
                <div>
                    <label className="block text-sm font-medium mb-1">Sent By</label>
                    <Input
                        value={formData.user}
                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}

                    />
                </div>

            </div>

            <div className="grid">
                <div>
                    <label className="block text-sm font-medium mb-1">Note/Comment</label>
                    <Textarea rows={4}
                        value={formData.comments}
                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    />
                </div>
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
