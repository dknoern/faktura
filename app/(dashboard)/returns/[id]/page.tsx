import { fetchReturnById } from "@/lib/data";
import ReturnForm from "@/components/returns/return-form";
import { notFound } from "next/navigation";


export default async function ReturnPage(props: { params: Promise<{ id: string }> }) {

  const params = await props.params;
  const id = params.id;

  // For new returns
  if (params.id === 'new') {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <ReturnForm />
      </div>
    );
  }

  const idNumber = parseInt(id);
  
  // For existing returns
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
