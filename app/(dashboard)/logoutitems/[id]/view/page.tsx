import { ViewOut } from "@/components/outs/view";
import { fetchOutById } from "@/lib/data";
import { getProductImages } from "@/lib/utils/storage";
import { notFound } from "next/navigation";


export default async function ViewOutPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;



    const [outitem, images] = await Promise.all([
        fetchOutById(id),
        getProductImages(id)
    ]);

    if (!outitem) {
        notFound();
    }

    // Serialize the MongoDB document to handle Date objects and ObjectIds
    const out = JSON.parse(JSON.stringify(outitem));

    return (
        <ViewOut out={out} initialImages={images} />
    );
}
