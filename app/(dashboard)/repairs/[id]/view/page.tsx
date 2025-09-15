import { fetchDefaultTenant, fetchRepairById } from "@/lib/data";
import { notFound } from "next/navigation";
import { getImageHost } from "@/lib/utils/imageHost";
import { getRepairImages } from "@/lib/utils/storage";
import { ViewRepairClient } from "@/components/repairs/view-client";

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

    // Ensure repair object and its nested properties are serializable
    const serializedRepair = JSON.parse(JSON.stringify(repair));
    const serializedTenant = JSON.parse(JSON.stringify(tenant));

    // Fetch images with error handling
    let images: string[] = [];
    try {
        images = await getRepairImages(repairId);
    } catch (error) {
        console.error('Error fetching repair images:', error);
        // Continue without images if there's an error
    }

    return (
        <ViewRepairClient 
            repair={serializedRepair}
            tenant={serializedTenant}
            imageBaseUrl={imageHost}
            images={images}
        />
    );
}
