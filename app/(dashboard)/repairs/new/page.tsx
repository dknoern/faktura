import { RepairForm } from "@/components/repairs/repair-form";
import { fetchCustomerById, fetchProductById } from "@/lib/data";
import { redirect } from "next/navigation";




type SearchParams = Promise<{ customerId?: string, productId?: string }>

export default async function NewRepairPage({ searchParams }: { searchParams: SearchParams }) {

    const params = await searchParams;


    // If no customer ID is provided, redirect back to repairs page
    if (!params.customerId) {
        redirect("/repairs");
    }

    let product = null;
    if(params.productId){
        const productRecord = await fetchProductById(params.productId);
        product = JSON.parse(JSON.stringify(productRecord));
    }

    const customerId = parseInt(params.customerId);

    const customerData = await fetchCustomerById(customerId);

    // If customer not found, redirect back to repairs page
    if (!customerData) {
        redirect("/repairs");
    }

    // Serialize the customer data to avoid passing Mongoose objects to client components
    const customer = JSON.parse(JSON.stringify(customerData));

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Repair</h1>
            <RepairForm selectedCustomer={customer} initialSelectedProduct={product} />
        </div>
    );
}
