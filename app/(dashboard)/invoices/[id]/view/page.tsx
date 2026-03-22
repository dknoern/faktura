import { fetchInvoiceById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewInvoice } from "@/components/invoices/view";

export default async function ViewInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;

    const invoice = await fetchInvoiceById(id);

    if (!invoice) {
        notFound();
    }

    return (
        <ViewInvoice invoice={invoice} />
    );
}
