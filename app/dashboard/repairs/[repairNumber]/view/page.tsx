import { fetchRepairByNumber } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default async function ViewRepairPage(props: { params: Promise<{ repairNumber: string }> }) {

  const params = await props.params;
  const repairNumber = params.repairNumber;

  const repair = await fetchRepairByNumber(repairNumber);

  if (!repair) {
    return <div>Repair not found</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight pl-1.5">
          Repair #{repair.repairNumber}
        </h2>
        <Button asChild variant="outline">
          <Link href={`/dashboard/repairs/${repair.repairNumber}/edit`}>
            Edit Repair
          </Link>
        </Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Repair Details</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Repair Number:</span>{" "}
                  {repair.repairNumber}
                </div>
                <div>
                  <span className="font-medium">Item Number:</span>{" "}
                  {repair.itemNumber}
                </div>
                <div>
                  <span className="font-medium">Description:</span>{" "}
                  {repair.description}
                </div>
                <div>
                  <span className="font-medium">Vendor:</span> {repair.vendor}
                </div>
                <div>
                  <span className="font-medium">Repair Cost:</span> $
                  {repair.repairCost ? repair.repairCost.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Dates</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Date Out:</span>{" "}
                  {repair.dateOut
                    ? new Date(repair.dateOut).toLocaleDateString()
                    : "Not set"}
                </div>
                <div>
                  <span className="font-medium">Customer Approved:</span>{" "}
                  {repair.customerApprovedDate
                    ? new Date(repair.customerApprovedDate).toLocaleDateString()
                    : "Not set"}
                </div>
                <div>
                  <span className="font-medium">Return Date:</span>{" "}
                  {repair.returnDate
                    ? new Date(repair.returnDate).toLocaleDateString()
                    : "Not set"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
            <div className="mt-2 space-y-2">
              <div>
                <span className="font-medium">Name:</span> {repair.customerFirstName}{" "}
                {repair.customerLastName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 