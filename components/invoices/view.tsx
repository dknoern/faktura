"use client";

import * as React from "react";
import Image from "next/image";
import { Smartphone, MapPin, Globe, Printer, Edit, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface LineItem {
    itemNumber: string;
    name: string;
    amount: number;
    serialNumber?: string;
    longDesc?: string;
}

interface Invoice {
    _id: number;
    customerFirstName: string;
    customerLastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    invoiceType: string;
    paymentMethod: string;
    lineItems: LineItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    date: string;
}

export function ViewInvoice({invoice, tenant}:  {invoice: Invoice, tenant: any}) {

    const router = useRouter();
    const [isEmailSending, setIsEmailSending] = useState(false);
    const [emailStatus, setEmailStatus] = useState<string | null>(null);

    
    // Function to handle printing
    const handlePrint = () => {
        window.print();
    };
    
    // Function to navigate to edit page
    const handleEdit = () => {
        router.push(`/dashboard/invoices/${invoice._id}/edit`);
    };
    
    // Function to send email
    const handleEmail = async () => {
        setIsEmailSending(true);
        setEmailStatus(null);
        
        try {
            const response = await fetch('/api/email/send-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoiceId: invoice._id,
                    email: 'david@seattleweb.com',
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setEmailStatus('Email sent successfully!');
            } else {
                setEmailStatus(`Error: ${data.error || 'Failed to send email'}`);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            setEmailStatus('Error: Failed to send email');
        } finally {
            setIsEmailSending(false);
        }
    };

    const getApiUrl = (tenantId: string) => {
        return `/api/images/logo-${tenantId}.png`;
    };

    return (
        <div className="container mx-auto py-6 px-8 max-w-4xl">
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mb-4 print:hidden">
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={handlePrint}
                >
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={handleEdit}
                >
                    <Edit className="h-4 w-4" />
                    Edit
                </Button>
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={handleEmail}
                    disabled={isEmailSending}
                >
                    <Mail className="h-4 w-4" />
                    {isEmailSending ? 'Sending...' : 'Email'}
                </Button>
            </div>
            
            {/* Email Status Message */}
            {emailStatus && (
                <div className={`mb-4 p-2 rounded text-sm print:hidden ${emailStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {emailStatus}
                </div>
            )}
            
            <div className="bg-white p-8 rounded-lg shadow print:shadow-none">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-48">
                            <Image
                                src={getApiUrl(tenant._id)}
                                alt={tenant.nameLong} 
                                width={300}
                                height={80}
                                className="w-full max-w-[200px]"
                                unoptimized
                            />
                            <h2 className="text-xl mt-2 text-[#B69D57]">INVOICE</h2>
                        </div>
                        <div className="text-sm text-right">
                            <p>Invoice # {invoice._id}</p>
                            <p>Invoice Date: {new Date(invoice.date).toLocaleDateString()}</p>
                            <p>Method of Sale: {invoice.invoiceType}</p>
                            <p>Paid By: {invoice.paymentMethod || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Sale Type and Billing Address */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold mb-2">SALE TYPE</h3>
                        <p className="uppercase">{invoice.customerFirstName} {invoice.customerLastName}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">BILLING ADDRESS</h3>
                        <p>{invoice.customerFirstName} {invoice.customerLastName}</p>
                        <p>{invoice.address}</p>
                        <p>{invoice.city}, {invoice.state} {invoice.zip}</p>
                    </div>
                </div>

                {/* Item Description */}
                <div className="mb-8">
                    <div className="grid grid-cols-[1fr,auto] gap-4">
                        <h3 className="font-bold">ITEM DESCRIPTION</h3>
                        <h3 className="font-bold text-right">TOTAL</h3>
                    </div>
                    <div className="border-t border-b border-gray-200 py-4 my-2">
                        {invoice.lineItems.map((item: LineItem, index: number) => (
                            <div key={index} className="grid grid-cols-[1fr,auto] gap-4 mb-2">
                                <p className="text-sm">{item.name}</p>
                                <p className="text-sm text-right">
                                    ${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-[1fr,auto] gap-4 mt-4">
                        <div></div>
                        <div className="text-right">
                            <p className="text-sm mb-1">SUB TOTAL: ${(invoice.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p className="text-sm mb-1">TAX: ${(invoice.tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p className="text-sm mb-4">SHIPPING: ${(invoice.shipping || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <div className="bg-[#B69D57] text-white px-4 py-2">
                                <p className="font-bold">TOTAL DUE: ${(invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warranty and Return Policy */}
                <div className="text-sm space-y-4 mb-8">
                    <div>
                        <h3 className="font-bold mb-2">Warranty:</h3>
                        <p className="text-gray-600">{tenant.warranty}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">Return Privilege:</h3>
                        <p className="text-gray-600">{tenant.returnPolicy}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between text-sm mb-8">
                    <div className="flex items-start">
                        <Smartphone className="h-5 w-5 text-[#B69D57] mt-0.5 mr-2" />
                        <div>
                            <h3 className="font-bold mb-1">PHONE</h3>
                            <p>{tenant.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-[#B69D57] mt-0.5 mr-2" />
                        <div>
                            <h3 className="font-bold mb-1">ADDRESS</h3>
                            <p>{tenant.address}</p>
                            <p>{tenant.city}, {tenant.state} {tenant.zip}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Globe className="h-5 w-5 text-[#B69D57] mt-0.5 mr-2" />
                        <div>
                            <h3 className="font-bold mb-1">WEB</h3>
                            <p>{tenant.website}</p>
                        </div>
                    </div>
                </div>

                {/* Bank Wire Transfer Instructions */}
                <div className="text-sm">
                    <h3 className="mb-2">BANK WIRE TRANSFER INSTRUCTIONS</h3>
                    <div className="grid grid-cols-[auto,1fr] gap-x-8 gap-y-1">
                        <p>{tenant.bankWireTransferInstructions}</p>
                    </div>
                </div>
            </div>
            
            {/* Action Buttons (Bottom) */}
            <div className="flex justify-center gap-4 mt-6 print:hidden">
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={handlePrint}
                >
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={handleEdit}
                >
                    <Edit className="h-4 w-4" />
                    Edit
                </Button>
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={handleEmail}
                    disabled={isEmailSending}
                >
                    <Mail className="h-4 w-4" />
                    {isEmailSending ? 'Sending...' : 'Email'}
                </Button>
            </div>
        </div>
    );
}
