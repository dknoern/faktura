import { redirect } from "next/navigation";
import { LogForm } from "@/components/logs/form";

export default async function LogPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  // For new logs
  if (id === 'new') {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <LogForm />
      </div>
    );
  }

  // For existing logs, redirect to view page
  redirect(`/loginitems/${id}/view`);
}
