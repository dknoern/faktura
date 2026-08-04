import { CustomerForm } from "@/components/customers/form";
import { fetchCustomerById } from "@/lib/data";
import { getTenantId } from "@/lib/auth-utils";
import { loadTenantRequiredData } from "@/lib/tenant-required-data";
import { notFound } from 'next/navigation';

export default async function EditCustomerPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const tenantId = await getTenantId();
    const [customer, requiredData] = await Promise.all([
        fetchCustomerById(id),
        loadTenantRequiredData(tenantId),
    ]);

    if (!customer) {
        notFound();
    }
    return (
        <div>
            <div>
                <h2 className='text-2xl font-bold tracking-tight'>Update Customer</h2>
            </div>
            <div>
                <CustomerForm customer={JSON.parse(JSON.stringify(customer))} requiredData={requiredData} />
            </div>
        </div>
    );
}

