import { fetchLogItemById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ViewLog } from "@/components/logs/view";
import { getLogImages } from "@/lib/utils/storage";

export default async function ViewLogPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const [logitem, images] = await Promise.all([
        fetchLogItemById(id),
        getLogImages(id)
    ]);

    if (!logitem) {
        notFound();
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const log = JSON.parse(JSON.stringify(logitem));

    return (
        <ViewLog log={log} initialImages={images} />
    );
}
