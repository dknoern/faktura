import { fetchLogItemById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewLog } from "@/components/logs/view";

export default async function ViewLogPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const logitem = await fetchLogItemById(id);

    if (!logitem) {
        notFound();
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const log = JSON.parse(JSON.stringify(logitem));

    return (
        <ViewLog log={log} />
    );
}
