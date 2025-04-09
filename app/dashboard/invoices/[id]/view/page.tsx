import { fetchInvoiceById, fetchDefaultTenant } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewInvoice } from "@/components/invoices/view";

export default async function ViewInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;

    const [invoice, tenant] = await Promise.all([
        fetchInvoiceById(parseInt(id)),
        fetchDefaultTenant()
    ]);

    if (!invoice) {
        notFound();
    }

    return (
        <ViewInvoice invoice={invoice} tenant={tenant} />
    );
}
