import { VendorForm } from "@/components/vendors/form";
import { fetchVendorById, fetchTenant } from "@/lib/data";
import { notFound } from 'next/navigation';

export default async function EditVendorPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const [vendor, tenant] = await Promise.all([
        fetchVendorById(id),
        fetchTenant(),
    ]);

    if (tenant?.features?.vendors !== true) {
        notFound();
    }
    if (!vendor) {
        notFound();
    }
    return (
        <div>
            <div>
                <h2 className='text-2xl font-bold tracking-tight'>Update Vendor</h2>
            </div>
            <div>
                <VendorForm vendor={JSON.parse(JSON.stringify(vendor))} />
            </div>
        </div>
    );
}
