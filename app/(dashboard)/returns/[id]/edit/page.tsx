import { fetchReturnById } from "@/lib/data";
import ReturnForm from "@/components/returns/return-form";
import { notFound } from "next/navigation";

export default async function EditReturnPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const idNumber = parseInt(id);
    
    const returnData = await fetchReturnById(idNumber);
    
    if (!returnData) {
        notFound();
    }
    
    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <ReturnForm initialData={returnData} />
        </div>
    );
}
