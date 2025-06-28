"use client";

import * as React from "react";
import { Invoice, Tenant, generateInvoiceHtml } from "@/lib/invoice-renderer";
import { InvoiceActionMenu } from "./invoice-action-menu";

export function ViewInvoice({invoice, tenant, imageBaseUrl}:  {invoice: Invoice, tenant: Tenant, imageBaseUrl: string}) {

    return (
        <div className="container mx-auto py-6 px-8 max-w-4xl">
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mb-4 print:hidden">

                <InvoiceActionMenu invoice={invoice} />
            </div>
            <div className="bg-white p-8 rounded-lg shadow print:shadow-none">

                {/* Invoice Content - Using the shared renderer */}
                <div 
                    className="invoice-content" 
                    dangerouslySetInnerHTML={{ __html: generateInvoiceHtml(invoice, tenant, imageBaseUrl) }}
                />
            </div>
        </div>
    );
}
