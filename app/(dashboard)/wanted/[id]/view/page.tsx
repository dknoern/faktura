import { fetchWantedById } from "@/lib/data";
import { ViewWanted } from "@/components/wanted/view";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>

export default async function WantedViewPage({ params }: { params: Params }) {
  try {
    const { id } = await params;
    const wanted = await fetchWantedById(id);

    if (!wanted) {
      notFound();
    }

    return <ViewWanted wanted={wanted} />;
  } catch (error) {
    console.error('Error fetching wanted item:', error);
    notFound();
  }
}
