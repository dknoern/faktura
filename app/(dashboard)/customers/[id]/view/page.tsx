import { CustomerViewDetails } from "@/components/customers/customer-view-details";
import { CustomerRecordsTabs } from "@/components/customers/customer-records-tabs";
import { fetchCustomerById, fetchTenant } from "@/lib/data";
import { notFound } from 'next/navigation';

export default async function ViewCustomerPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const [customer, tenant] = await Promise.all([
        fetchCustomerById(id),
        fetchTenant(),
    ]);

    if (!customer) {
        notFound();
    }

    const proposalsEnabled = tenant?.features?.proposals === true;
    const repairsEnabled = tenant?.features?.repairs === true;
    const wantedEnabled = tenant?.features?.wanted === true;
    return (
        <div className="space-y-6">
            <div>
                <CustomerViewDetails
                    customer={JSON.parse(JSON.stringify(customer))}
                    proposalsEnabled={proposalsEnabled}
                    repairsEnabled={repairsEnabled}
                    wantedEnabled={wantedEnabled}
                />
                <div className="mt-8">
                    <CustomerRecordsTabs customerId={customer._id.toString()} />
                </div>
            </div>
        </div>
    );
}
