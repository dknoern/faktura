"use client";

import * as React from "react";
import { Printer, Edit, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Invoice, Tenant, generateInvoiceHtml } from "@/lib/invoice-renderer";

export function ViewInvoice({invoice, tenant, imageBaseUrl}:  {invoice: Invoice, tenant: Tenant, imageBaseUrl: string}) {

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

                {/* Invoice Content - Using the shared renderer */}
                <div 
                    className="invoice-content" 
                    dangerouslySetInnerHTML={{ __html: generateInvoiceHtml(invoice, tenant, imageBaseUrl) }}
                />
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
