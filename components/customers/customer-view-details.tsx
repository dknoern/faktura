"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { customerSchema } from "@/lib/models/customer";
import { z } from "zod";
import { CustomerActionMenu } from "./customer-action-menu";
import { CustomerAttachments } from "./customer-attachments";
import { useState } from "react";

type Customer = z.infer<typeof customerSchema> & { _id: string };

interface CustomerViewDetailsProps {
    customer: Customer;
}

export function CustomerViewDetails({ customer: initialCustomer }: CustomerViewDetailsProps) {
    const [customer, setCustomer] = useState(initialCustomer);

    const handleAttachmentChange = async () => {
        // Refresh customer data to get updated attachments
        try {
            const response = await fetch(`/api/customers/${customer._id}`);
            if (response.ok) {
                const updatedCustomer = await response.json();
                setCustomer(updatedCustomer);
            }
        } catch (error) {
            console.error('Error refreshing customer data:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Action Menu */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">
                        {customer.firstName} {customer.lastName}
                    </h1>
                    {customer.company && (
                        <p className="text-lg text-muted-foreground mt-1">
                            {customer.company}
                        </p>
                    )}
                </div>
                <CustomerActionMenu customer={customer} onAttachmentUpload={handleAttachmentChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                            <p className="text-sm">{customer.customerNumber}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-sm">{customer.firstName} {customer.lastName}</p>
                        </div>
                        {customer.company && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Company</label>
                                <p className="text-sm">{customer.company}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Customer Type</label>
                            <div className="mt-1">
                                <Badge variant={customer.customerType === 'Direct' ? 'default' : 'secondary'}>
                                    {customer.customerType}
                                </Badge>
                            </div>
                        </div>
                        {customer.status && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={customer.status === 'Active' ? 'default' : 'secondary'}>
                                        {customer.status}
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
                        {(customer.emails && customer.emails.length > 0) && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    {customer.emails.length > 1 ? 'Emails' : 'Email'}
                                </label>
                                <div className="space-y-1">
                                    {customer.emails.map((emailItem, index) => (
                                        <p key={index} className="text-sm">
                                            {typeof emailItem === 'string' ? emailItem : emailItem.email}
                                            {typeof emailItem === 'object' && emailItem.type && (
                                                <span className="text-muted-foreground ml-2">({emailItem.type})</span>
                                            )}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(customer.phones && customer.phones.length > 0) && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    {customer.phones.length > 1 ? 'Phone Numbers' : 'Phone'}
                                </label>
                                <div className="space-y-1">
                                    {customer.phones.map((phoneItem, index) => (
                                        <p key={index} className="text-sm">
                                            {typeof phoneItem === 'string' ? phoneItem : phoneItem.phone}
                                            {typeof phoneItem === 'object' && phoneItem.type && (
                                                <span className="text-muted-foreground ml-2">({phoneItem.type})</span>
                                            )}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                {(customer.address1 || customer.city || customer.state || customer.zip || customer.country) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {customer.address1 && <p className="text-sm">{customer.address1}</p>}
                            {customer.address2 && <p className="text-sm">{customer.address2}</p>}
                            {customer.address3 && <p className="text-sm">{customer.address3}</p>}
                            {(customer.city || customer.state || customer.zip) && (
                                <p className="text-sm">
                                    {[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}
                                </p>
                            )}
                            {customer.country && <p className="text-sm">{customer.country}</p>}
                        </CardContent>
                    </Card>
                )}

                {/* Billing Address */}
                {(customer.billingAddress1 || customer.billingCity || customer.billingState || customer.billingZip || customer.billingCountry) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {customer.billingAddress1 && <p className="text-sm">{customer.billingAddress1}</p>}
                            {customer.billingAddress2 && <p className="text-sm">{customer.billingAddress2}</p>}
                            {customer.billingAddress3 && <p className="text-sm">{customer.billingAddress3}</p>}
                            {(customer.billingCity || customer.billingState || customer.billingZip) && (
                                <p className="text-sm">
                                    {[customer.billingCity, customer.billingState, customer.billingZip].filter(Boolean).join(', ')}
                                </p>
                            )}
                            {customer.billingCountry && <p className="text-sm">{customer.billingCountry}</p>}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Attachments Section */}
            <CustomerAttachments customer={customer} onAttachmentDeleted={handleAttachmentChange} />
        </div>
    );
}
