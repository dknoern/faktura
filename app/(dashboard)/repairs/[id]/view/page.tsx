import { fetchDefaultTenant, fetchRepairById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewRepair } from "@/components/repairs/view";

export default async function ViewRepairPage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const repairId = params.id;

    const [repair, tenant] = await Promise.all([
        fetchRepairById(repairId),
        fetchDefaultTenant()
    ]);

    if (!repair) {
        notFound();
    }

    return (
        <ViewRepair repair={repair} tenant={tenant} />
    );
}
