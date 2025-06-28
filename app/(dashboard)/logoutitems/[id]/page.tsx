import { redirect } from "next/navigation";
import { OutForm } from "@/components/outs/form";

export default async function OutPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  // For new outs
  if (id === 'new') {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <OutForm />
      </div>
    );
  }

  // For existing outs, redirect to view page
  redirect(`/logoutitems/${id}/view`);
}
