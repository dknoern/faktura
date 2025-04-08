import { fetchDefaultTenant, fetchInvoiceById } from "@/lib/data";
import Image from "next/image";
import { Smartphone, MapPin, Globe } from "lucide-react";

interface LineItem {
    itemNumber: string;
    name: string;
    amount: number;
    serialNumber?: string;
    longDesc?: string;
}

export default async function ViewInvoicePage(props: { params: Promise<{ id: number }> }) {
    const params = await props.params;
    const id = params.id;

    const invoice = await fetchInvoiceById(id);

    const tenant = await fetchDefaultTenant();
    if (!invoice) {
        return <div>Invoice not found</div>;
    }

    if (!tenant) {
        return <div>Company information not found</div>;
    }

    const getApiUrl = (tenantId: string) => {
        return `/api/images/logo-${tenantId}.png`;
    };

    return (
        <div className="container mx-auto py-6 px-8 max-w-4xl">
            <div className="bg-white p-8 rounded-lg shadow">
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
        </div>
    );
}
