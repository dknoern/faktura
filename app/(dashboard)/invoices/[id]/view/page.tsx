import { fetchInvoiceById, fetchDefaultTenant } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewInvoice } from "@/components/invoices/view";
import { getImageHost } from "@/lib/utils/imageHost";

export default async function ViewInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;
    const imageHost = await getImageHost();

    if (isNaN(parseInt(id))) {
        notFound();
    }

    const [invoice, tenant] = await Promise.all([
        fetchInvoiceById(parseInt(id)),
        fetchDefaultTenant()
    ]);

    if (!invoice) {
        notFound();
    }

    return (
        <ViewInvoice invoice={invoice} tenant={tenant} imageBaseUrl={imageHost} />
    );
}
