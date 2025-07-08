import { ProposalForm } from "@/components/proposals/form";
import { fetchCustomerById } from "@/lib/data";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ customerId: string }>
}

export default async function Page({ params }: PageProps) {
  const { customerId } = await params;
  
  const customer = await fetchCustomerById(parseInt(customerId));
  
  if (!customer) {
    notFound();
  }

  // Serialize customer to plain object for client component
  const serializedCustomer = {
    _id: customer._id.toString(),
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone
  };

  return (
    <div className="container mx-auto py-6">
      <ProposalForm customer={serializedCustomer} />
    </div>
  );
}
