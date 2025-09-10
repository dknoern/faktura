import { Suspense } from "react"
import { CustomerForm } from "@/components/customers/form"

function CustomerCreateContent() {
  return <CustomerForm />
}

export default function CustomerCreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
              <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">New Customer</h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
      <CustomerCreateContent />
      </div>
    </Suspense>
  )
}
