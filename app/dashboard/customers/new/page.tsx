import { CustomerForm } from "@/components/customers/form";

export default function NewCustomerPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">New Customer</h2>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <CustomerForm />
      </div>
    </div>
  );
} 