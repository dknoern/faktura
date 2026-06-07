import { InvoiceForm } from "@/components/invoices/form";
import { fetchCustomerById, fetchProductById, fetchProposalById } from "@/lib/data";
import { redirect } from "next/navigation";
import { getFullName } from "@/lib/auth-utils";

type SearchParams = Promise<{ customerId?: string, productId?: string, proposalId?: string }>

export default async function NewInvoicePage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;

    // Load proposal first if provided, so we can fall back to its customerId
    let proposalLineItems: { name: string; longDesc?: string; amount: number }[] | undefined;
    let customerIdFromProposal: string | undefined;
    if (params.proposalId) {
        const proposal = await fetchProposalById(params.proposalId);
        if (proposal) {
            proposalLineItems = (proposal.lineItems || []).map((li: any) => ({
                name: li.name || "",
                longDesc: li.longDesc || "",
                amount: li.amount || 0,
            }));
            if (proposal.customerId) {
                customerIdFromProposal = proposal.customerId.toString();
            }
        }
    }

    const customerId = params.customerId || customerIdFromProposal;

    // If no customer ID is provided, redirect back to invoices page
    if (!customerId) {
        redirect("/invoices");
    }

    const customerData = await fetchCustomerById(customerId);
    const fullName = await getFullName()

    // If customer not found, redirect back to invoices page
    if (!customerData) {
        redirect("/invoices");
    }

    // Serialize the customer data to avoid passing Mongoose objects to client components
    const customer = JSON.parse(JSON.stringify(customerData));

    // Check if a product ID was provided
    let selectedProduct = null;
    if (params.productId) {
        const productData = await fetchProductById(params.productId);
        if (productData) {
            // Serialize the product data
            selectedProduct = JSON.parse(JSON.stringify(productData));
        }
    }

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>
            <InvoiceForm
                selectedCustomer={customer}
                selectedProduct={selectedProduct}
                proposalLineItems={proposalLineItems}
                salesPerson={fullName}
            />
        </div>
    );
}
