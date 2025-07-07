"use client";

import * as React from "react";
import { Invoice, Tenant, generateInvoiceHtml } from "@/lib/invoice-renderer";
import { InvoiceActionMenu } from "./invoice-action-menu";

export function ViewInvoice({invoice, tenant, imageBaseUrl}:  {invoice: Invoice, tenant: Tenant, imageBaseUrl: string}) {

    return (
        <div className="print:m-0 print:p-0 print:max-w-none">
            <div className="container mx-auto py-6 px-8 max-w-4xl print:max-w-none print:mx-0 print:py-0 print:px-0">
                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mb-4 print:hidden">
                    <InvoiceActionMenu invoice={invoice} />
                </div>
                
                <div className="bg-white p-8 rounded-lg shadow print:shadow-none print:p-0 print:rounded-none">
                    {/* Invoice Content - Using the shared renderer */}
                    <div 
                        className="invoice-content" 
                        dangerouslySetInnerHTML={{ __html: generateInvoiceHtml(invoice, tenant, imageBaseUrl) }}
                    />
                </div>
            </div>
        </div>
    );
}
