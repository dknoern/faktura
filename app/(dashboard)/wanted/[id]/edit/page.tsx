import { fetchWantedById } from "@/lib/data";
import { WantedForm } from "@/components/wanted/form";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>

export default async function EditWantedPage({ params }: { params: Params }) {
  try {
    const { id } = await params;
    const wanted = await fetchWantedById(id);

    if (!wanted) {
      notFound();
    }

    return <WantedForm wanted={wanted} isEditing={true} />;
  } catch (error) {
    console.error('Error fetching wanted item:', error);
    notFound();
  }
}
