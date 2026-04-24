import { fetchReturnById, fetchTenant } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewReturn } from "@/components/returns/view";

export default async function ViewReturnPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const [returnData, tenant] = await Promise.all([
        fetchReturnById(id),
        fetchTenant()
    ]);

    if (!returnData) {
        notFound();
    }

    return (
        <ViewReturn returnData={returnData} tenant={tenant} />
    );
}
