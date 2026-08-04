import { fetchInvoiceById, fetchTenant } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewInvoice } from "@/components/invoices/view";
import { getTenantId } from "@/lib/auth-utils";
import { loadTenantAvataxConfig } from "@/lib/avatax/config";
import { getPaymentsForInvoice } from "@/lib/actions/payment-actions";

export default async function ViewInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;

    const invoice = await fetchInvoiceById(id);

    if (!invoice) {
        notFound();
    }

    const tenantId = await getTenantId();
    const [avataxConfig, tenant] = await Promise.all([
        loadTenantAvataxConfig(tenantId),
        fetchTenant(),
    ]);

    const avataxEnabled = !!avataxConfig?.enabled;
    const paymentsEnabled = tenant?.features?.payments === true;

    const initialPayments = paymentsEnabled ? await getPaymentsForInvoice(id) : [];

    return (
        <ViewInvoice
            invoice={invoice}
            avataxEnabled={avataxEnabled}
            paymentsEnabled={paymentsEnabled}
            initialPayments={initialPayments}
        />
    );
}
