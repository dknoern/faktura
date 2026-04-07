import { ViewProposal } from "@/components/proposals/view-proposal";
import { fetchProposalById } from "@/lib/data";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  const proposal = await fetchProposalById(id);

  if (!proposal) {
    notFound();
  }

  return (
    <ViewProposal proposal={proposal} />
  );
}
