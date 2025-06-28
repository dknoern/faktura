import { redirect } from "next/navigation";
import ReturnForm from "@/components/returns/return-form";

export default async function ReturnPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  // For new returns
  if (id === 'new') {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <ReturnForm />
      </div>
    );
  }

  // For existing returns, redirect to view page
  redirect(`/returns/${id}/view`);
}
