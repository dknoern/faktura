import { fetchInvoiceById } from "@/lib/data";

interface LineItem {
    itemNumber: string;
    name: string;
}
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ViewInvoicePage(props: { params: Promise<{ id: number }> }) {
    const params = await props.params;
    const id = params.id;

    console.log('Invoice id:', id);
    const invoice = await fetchInvoiceById(id);

    if (!invoice) {
        return <div>Invoice not found</div>;
    }

    return (
        <div className="container mx-auto py-6">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                    Invoice #{invoice._id}
                </h2>
                <Button asChild variant="outline">
                    <Link href={`/dashboard/invoices/${invoice._id}/edit`}>
                        Edit Invoice
                    </Link>
                </Button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                            <p className="mt-1">{invoice.customerFirstName} {invoice.customerLastName}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Date</h3>
                            <p className="mt-1">{new Date(invoice.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Invoice Type</h3>
                            <p className="mt-1">{invoice.invoiceType}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Tracking Number</h3>
                            <p className="mt-1">{invoice.trackingNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Line Items</h3>
                        <div className="space-y-3">
                            {invoice.lineItems.map((item: LineItem, index: number) => (
                                <div key={index} className="flex justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium">{item.itemNumber}</p>
                                        <p className="text-sm text-gray-600">{item.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-right">
                            <h3 className="text-sm font-medium text-gray-500">Total</h3>
                            <p className="text-xl font-bold">
                                {Math.ceil(invoice.total).toLocaleString('en-US', { 
                                    style: 'currency', 
                                    currency: 'USD' 
                                }).replace('.00', '')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
