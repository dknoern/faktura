import { InvoiceForm } from "@/components/invoices/form";
import { fetchCustomerById } from "@/lib/data";
import { redirect } from "next/navigation";




type SearchParams = Promise<{ customerId?: string }>

export default async function NewInvoicePage({ searchParams }: { searchParams: SearchParams }) {

    const params = await searchParams;


    // If no customer ID is provided, redirect back to invoices page
    if (!params.customerId) {
        redirect("/dashboard/invoices");
    }

    const customerId = parseInt(params.customerId);

    const customerData = await fetchCustomerById(customerId);

    // If customer not found, redirect back to invoices page
    if (!customerData) {
        redirect("/dashboard/invoices");
    }

    // Serialize the customer data to avoid passing Mongoose objects to client components
    const customer = JSON.parse(JSON.stringify(customerData));

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>
            <InvoiceForm selectedCustomer={customer} />
        </div>
    );
}
