import { fetchInvoiceById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewInvoice } from "@/components/invoices/view";
import { getTenantId } from "@/lib/auth-utils";
import { loadTenantAvataxConfig } from "@/lib/avatax/config";

export default async function ViewInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;

    const invoice = await fetchInvoiceById(id);

    if (!invoice) {
        notFound();
    }

    const tenantId = await getTenantId();
    const avataxConfig = await loadTenantAvataxConfig(tenantId);
    const avataxEnabled = !!avataxConfig?.enabled;

    return (
        <ViewInvoice invoice={invoice} avataxEnabled={avataxEnabled} />
    );
}
