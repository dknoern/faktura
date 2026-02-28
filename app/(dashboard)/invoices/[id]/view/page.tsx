import { fetchInvoiceById, fetchDefaultTenant, fetchTenantById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewInvoice } from "@/components/invoices/view";
import { getImageHost } from "@/lib/utils/imageHost";
import { getTenantId } from "@/lib/auth-utils";

export default async function ViewInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;
    const imageHost = await getImageHost();

    const tenantId = await getTenantId();
    const tenant = await fetchTenantById(tenantId);

    const [invoice] = await Promise.all([
        fetchInvoiceById(id),
    ]);

    if (!invoice) {
        notFound();
    }

    return (
        <ViewInvoice invoice={invoice} tenant={tenant} imageBaseUrl={imageHost} />
    );
}
