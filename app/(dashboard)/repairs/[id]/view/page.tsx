import { fetchDefaultTenant, fetchRepairById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewRepair } from "@/components/repairs/view";
import { getImageHost } from "@/lib/utils/imageHost";

export default async function ViewRepairPage(props: { params: Promise<{ id: string }> }) {

    const params = await props.params;
    const repairId = params.id;
    const imageHost = await getImageHost();

    const [repair, tenant] = await Promise.all([
        fetchRepairById(repairId),
        fetchDefaultTenant()
    ]);

    if (!repair) {
        notFound();
    }

    return (
        <ViewRepair repair={repair} tenant={tenant} imageBaseUrl={imageHost} />
    );
}
