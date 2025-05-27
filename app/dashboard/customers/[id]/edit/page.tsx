import { CustomerForm } from "@/components/customers/form";
import { CustomerRecordsTabs } from "@/components/customers/customer-records-tabs";
import { fetchCustomerById } from "@/lib/data";
import { notFound } from 'next/navigation';
export default async function EditCustomerPage(props: { params: Promise<{ id: number }> }) {

    const params = await props.params;
    const id = params.id;
    const [customer] = await Promise.all([
        fetchCustomerById(id)
    ]);

    if (!customer) {
        notFound();
    }
    return (
        <div>
            <div>
                <h2 className='text-2xl font-bold tracking-tight'>Customer</h2>
            </div>
            <div>
                <CustomerForm customer={JSON.parse(JSON.stringify(customer))} />
                <CustomerRecordsTabs customerId={customer._id} />
            </div>
        </div>
    );
}

