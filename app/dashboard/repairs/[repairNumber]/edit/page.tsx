import { RepairForm } from "@/components/repairs/repair-form";
import { fetchRepairByNumber } from "@/lib/data";


export default async function EditRepairPage(props: { params: Promise<{ repairNumber: string }> }) {

  const params = await props.params;
  const repairNumber = params.repairNumber;

  console.log('Repair number:', repairNumber);
  const repair = await fetchRepairByNumber(repairNumber);

  if (!repair) {
    return <div>Repair not found</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight pl-1.5">Edit Repair</h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <RepairForm repair={repair} />
      </div>
    </div>
  );
} 