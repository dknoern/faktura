import { ViewProposal } from "@/components/proposals/view-proposal";
import { fetchProposalById, fetchCustomerById } from "@/lib/data";
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

  let customerEmail = "";
  if (proposal.customerId) {
    const customer = await fetchCustomerById(proposal.customerId, { includeDeleted: true });
    if (customer) {
      const first = customer.emails?.[0];
      const firstFromArray = typeof first === "string" ? first : first?.email;
      customerEmail = (firstFromArray || customer.email || "").trim();
    }
  }

  return (
    <ViewProposal proposal={proposal} customerEmail={customerEmail} />
  );
}
