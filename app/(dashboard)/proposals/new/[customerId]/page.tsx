import { ProposalForm } from "@/components/proposals/form";
import { fetchCustomerById, fetchTenant } from "@/lib/data";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ customerId: string }>
}

export default async function Page({ params }: PageProps) {
  const { customerId } = await params;
  
  const [customer, tenant] = await Promise.all([
    fetchCustomerById(customerId),
    fetchTenant(),
  ]);
  
  if (!customer) {
    notFound();
  }

  // New proposals start with the tenant's default proposal terms as their
  // conditions, when the tenant has set any.
  const defaultConditions = tenant?.proposalConditions?.trim() || undefined;

  // Serialize customer to plain object for client component
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
      <ProposalForm customer={serializedCustomer} defaultConditions={defaultConditions} />
    </div>
  );
}
