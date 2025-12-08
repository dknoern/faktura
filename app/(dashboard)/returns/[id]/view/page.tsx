import { fetchDefaultTenant, fetchReturnById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewReturn } from "@/components/returns/view";

export default async function ViewReturnPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const [returnData, tenant] = await Promise.all([
        fetchReturnById(params.id),
        fetchDefaultTenant()
    ]);

    if (!returnData) {
        notFound();
    }

    return (
        <ViewReturn returnData={returnData} tenant={tenant} />
    );
}
