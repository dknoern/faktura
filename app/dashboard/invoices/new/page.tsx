import { InvoiceForm } from "@/components/invoices/form";

export default function NewInvoicePage() {
    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>
            <InvoiceForm />
        </div>
    );
}
