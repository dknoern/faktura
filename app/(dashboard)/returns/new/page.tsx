import { fetchInvoiceById } from "@/lib/data";
import ReturnForm from "@/components/returns/return-form";
import { notFound } from "next/navigation";
import Link from "next/link";

interface InvoiceLineItem {
  productId?: string;
  itemNumber?: string;
  name?: string;
  amount?: number;
  serialNumber?: string;
  longDesc?: string;
}

export default async function NewReturnPage({ searchParams }: { searchParams: Promise<{ invoiceId?: string }> }) {
  // Await the searchParams promise
  const params = await searchParams;
  
  // If we have an invoice ID, fetch the invoice to pre-populate the form
  if (params.invoiceId) {
    const invoiceId = parseInt(params.invoiceId);
    const invoice = await fetchInvoiceById(invoiceId);
    
    if (!invoice) {
      notFound();
    }
    
    // Pre-populate return data from invoice
    const initialData = {
      customerName: `${invoice.customerFirstName || ''} ${invoice.customerLastName || ''}`.trim(),
      customerId: invoice.customerId,
      invoiceId: invoice._id.toString(),
      returnDate: new Date().toISOString().split('T')[0],
      subTotal: 0,
      taxable: invoice.taxable || false,
      salesTax: 0,
      shipping: 0,
      totalReturnAmount: 0,
      salesPerson: invoice.salesPerson,
      lineItems: invoice.lineItems.map((item: InvoiceLineItem) => ({
        productId: item.productId,
        itemNumber: item.itemNumber || '',
        name: item.name || '',
        amount: item.amount || 0,
        serialNo: item.serialNumber || '',
        longDesc: item.longDesc || '',
        included: false // Default to not included in return
      }))
    };
    
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Create Return for Invoice #{invoice._id}</h1>
        <ReturnForm initialData={initialData} />
      </div>
    );
  }
  
  // If no invoice ID, just show an empty form, should not happen unless someone enters URL directly
  return (
    <div>
      Select invoice from <Link style={{ color: 'blue' }} href="/invoices">Invoices</Link> and then click &quot;Create Return&quot;
    </div>
  );
}
