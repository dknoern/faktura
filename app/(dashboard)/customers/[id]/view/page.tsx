import { CustomerViewDetails } from "@/components/customers/customer-view-details";
import { CustomerRecordsTabs } from "@/components/customers/customer-records-tabs";
import { fetchCustomerById } from "@/lib/data";
import { notFound } from 'next/navigation';

export default async function ViewCustomerPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = Number(params.id);
    const customer = await fetchCustomerById(id);

    if (!customer) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <CustomerViewDetails customer={JSON.parse(JSON.stringify(customer))} />
                <div className="mt-8">
                    <CustomerRecordsTabs customerId={customer._id} />
                </div>
            </div>
        </div>
    );
}
