import { WantedForm } from "@/components/wanted/form";
import { fetchCustomerById } from "@/lib/data";
import { redirect } from "next/navigation";

type SearchParams = Promise<{ customerId?: string }>

export default async function NewWantedPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // If no customer ID is provided, redirect back to wanted page
  if (!params.customerId) {
    redirect("/wanted");
  }

  const customerId = parseInt(params.customerId);
  const customerData = await fetchCustomerById(customerId);

  // If customer not found, redirect back to wanted page
  if (!customerData) {
    redirect("/wanted");
  }

  // Serialize the customer data to avoid passing Mongoose objects to client components
  const customer = JSON.parse(JSON.stringify(customerData));

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Wanted Item</h1>
      <WantedForm selectedCustomer={customer} />
    </div>
  );
}
