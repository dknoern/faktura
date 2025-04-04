import { RepairForm } from "@/components/repairs/repair-form";

export default function NewRepairPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight pl-1.5">New Repair</h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <RepairForm />
      </div>
    </div>
  );
} 