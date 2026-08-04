import { InvoiceForm } from "@/components/invoices/form";
import { fetchInvoiceById } from "@/lib/data";
import { getTenantId } from "@/lib/auth-utils";
import { loadTenantAvataxConfig } from "@/lib/avatax/config";
import { loadTenantRequiredData } from "@/lib/tenant-required-data";

export default async function EditInvoicePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const tenantId = await getTenantId();
    const [invoice, avataxConfig, requiredData] = await Promise.all([
        fetchInvoiceById(id),
        loadTenantAvataxConfig(tenantId),
        loadTenantRequiredData(tenantId),
    ]);
    const avataxEnabled = !!avataxConfig?.enabled;

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Edit Invoice</h1>
            <InvoiceForm invoice={invoice} avataxEnabled={avataxEnabled} requiredData={requiredData} />
        </div>
    );
}
