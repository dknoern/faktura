import { VendorViewDetails } from "@/components/vendors/vendor-view-details";
import { fetchVendorById, fetchTenant } from "@/lib/data";
import { notFound } from 'next/navigation';
import { auth } from "@/auth";

export default async function ViewVendorPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const [vendor, tenant, session] = await Promise.all([
        fetchVendorById(id),
        fetchTenant(),
        auth(),
    ]);

    if (tenant?.features?.vendors !== true) {
        notFound();
    }
    if (!vendor) {
        notFound();
    }

    const isAdmin = (session?.user as any)?.role === "admin";
    return (
        <div className="space-y-6">
            <VendorViewDetails
                vendor={JSON.parse(JSON.stringify(vendor))}
                isAdmin={isAdmin}
            />
        </div>
    );
}
