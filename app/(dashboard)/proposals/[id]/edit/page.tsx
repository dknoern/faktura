import { ProposalForm } from "@/components/proposals/form";
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

  const customer = await fetchCustomerById(proposal.customerId.toString());
  
  if (!customer) {
    notFound();
  }

  const serializedCustomer = {
    _id: customer._id.toString(),
    customerNumber: customer.customerNumber,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.emails?.[0]?.email || '',
    phone: customer.phones?.[0]?.phone || ''
  };

  return (
    <div className="container mx-auto py-6">
      <ProposalForm customer={serializedCustomer} proposal={proposal} />
    </div>
  );
}
