"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vendorSchema } from "@/lib/models/vendor";
import { z } from "zod";
import { VendorActionMenu } from "./vendor-action-menu";
import { useState } from "react";

type Vendor = z.infer<typeof vendorSchema>;

interface VendorViewDetailsProps {
    vendor: Vendor;
    isAdmin?: boolean;
}

export function VendorViewDetails({ vendor: initialVendor, isAdmin = false }: VendorViewDetailsProps) {
    const [vendor, setVendor] = useState(initialVendor);

    return (
        <div className="space-y-6">
            {/* Header with Action Menu */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">
                        {vendor.firstName} {vendor.lastName}
                    </h1>
                    {vendor.company && (
                        <p className="text-lg text-muted-foreground mt-1">
                            {vendor.company}
                        </p>
                    )}
                </div>
                <VendorActionMenu vendor={vendor} isAdmin={isAdmin} onVendorChange={setVendor} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Vendor Number</label>
                            <p className="text-sm">{vendor.vendorNumber}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-sm">{vendor.firstName} {vendor.lastName}</p>
                        </div>
                        {vendor.company && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Company</label>
                                <p className="text-sm">{vendor.company}</p>
                            </div>
                        )}
                        {vendor.taxId && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                                <p className="text-sm">{vendor.taxId}</p>
                            </div>
                        )}
                        {vendor.venmoAlias && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Venmo Alias</label>
                                <p className="text-sm">{vendor.venmoAlias}</p>
                            </div>
                        )}
                        {vendor.status && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'}>
                                        {vendor.status}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-sm">{vendor.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-sm">{vendor.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">User Account</label>
                            <div className="mt-1">
                                {vendor.acceptedAt ? (
                                    <div className="space-y-1">
                                        <Badge variant="default">Active</Badge>
                                        <p className="text-xs text-muted-foreground">
                                            Invitation accepted {new Date(vendor.acceptedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ) : vendor.auth0UserId ? (
                                    <div className="space-y-1">
                                        <Badge variant="outline">Invitation pending</Badge>
                                        {vendor.invitedAt && (
                                            <p className="text-xs text-muted-foreground">
                                                Invitation sent {new Date(vendor.invitedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <Badge variant="secondary">Not invited</Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Address Information */}
            {(vendor.address1 || vendor.city || vendor.state || vendor.zip || vendor.country) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {vendor.address1 && <p className="text-sm">{vendor.address1}</p>}
                            {vendor.address2 && <p className="text-sm">{vendor.address2}</p>}
                            {(vendor.city || vendor.state || vendor.zip) && (
                                <p className="text-sm">
                                    {[vendor.city, vendor.state, vendor.zip].filter(Boolean).join(', ')}
                                </p>
                            )}
                            {vendor.country && <p className="text-sm">{vendor.country}</p>}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
