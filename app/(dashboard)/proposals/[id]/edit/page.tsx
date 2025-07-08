import { ProposalForm } from "@/components/proposals/form";
import { fetchProposalById, fetchCustomerById } from "@/lib/data";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  const proposal = await fetchProposalById(parseInt(id));
  
  if (!proposal) {
    notFound();
  }

  const customer = await fetchCustomerById(proposal.customerId);
  
  if (!customer) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <ProposalForm customer={customer} proposal={proposal} />
    </div>
  );
}
