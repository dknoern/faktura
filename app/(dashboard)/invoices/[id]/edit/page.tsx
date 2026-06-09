import { InvoiceForm } from "@/components/invoices/form";
import { fetchInvoiceById } from "@/lib/data";
import { getTenantId } from "@/lib/auth-utils";
import { loadTenantAvataxConfig } from "@/lib/avatax/config";



export default async function EditInvoicePage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const id = params.id;

    const invoice = await fetchInvoiceById(id);
    const tenantId = await getTenantId();
    const avataxConfig = await loadTenantAvataxConfig(tenantId);
    const avataxEnabled = !!avataxConfig?.enabled;

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Edit Invoice</h1>
            <InvoiceForm invoice={invoice} avataxEnabled={avataxEnabled} />
        </div>
    );
}
