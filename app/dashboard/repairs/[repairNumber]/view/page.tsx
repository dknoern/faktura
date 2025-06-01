import { fetchDefaultTenant, fetchRepairById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewRepair } from "@/components/repairs/view";

export default async function ViewRepairPage(props: { params: Promise<{ repairNumber: string }> }) {

    const params = await props.params;
    const repairNumber = params.repairNumber;

    const [repair, tenant] = await Promise.all([
        fetchRepairById(repairNumber),
        fetchDefaultTenant()
    ]);

    if (!repair) {
        notFound();
    }

    return (
        <ViewRepair repair={repair} tenant={tenant} />
    );
}
