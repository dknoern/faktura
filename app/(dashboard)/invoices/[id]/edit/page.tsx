import { InvoiceForm } from "@/components/invoices/form";
import { fetchInvoiceById } from "@/lib/data";



export default async function EditInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = Number(params.id);


    const invoice = await fetchInvoiceById(id);

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Edit Invoice</h1>
            <InvoiceForm invoice={invoice} />
        </div>
    );
}
