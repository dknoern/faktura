import { fetchRepairByNumber, fetchDefaultTenant } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Printer, Mail, Edit } from "lucide-react";


export default async function ViewRepairPage(props: { params: Promise<{ repairNumber: string }> }) {
  const params = await props.params;
  const repairNumber = params.repairNumber;

  const repair = await fetchRepairByNumber(repairNumber);
  const tenant = await fetchDefaultTenant();

  if (!repair) {
    return <div>Repair not found</div>;
  }

  if (!tenant) {
    return <div>Company information not found</div>;
  }

  const getApiUrl = (tenantId: string) => {
    return `/api/images/logo-${tenantId}.png`;
  };

  const formattedDate = repair.dateOut
    ? new Date(repair.dateOut).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <div className="container mx-auto py-1 px-4 max-w-4xl">


      <div className="bg-white p-8 rounded-lg shadow">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex flex-col items-start">
            <div className="w-48 mb-2">
              <Image
                src={getApiUrl(tenant._id)}
                alt={tenant.nameLong}
                width={300}
                height={80}
                className="w-full"
              />
            </div>
            <p className="text-sm">{tenant.nameLong}</p>
            <p className="text-sm">{tenant.address}</p>
            <p className="text-sm">{tenant.city}, {tenant.state} {tenant.zip}</p>
            <p className="text-sm">Phone {tenant.phone}</p>
            <p className="text-sm">Fax {tenant.fax}</p>
          </div>
        </div>

        {/* Repair Information */}
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="font-bold text-lg">Repair #</h3>
            <p>{repair.repairNumber}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-lg">Repair Date:</h3>
            <p>{formattedDate}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-lg">Customer Name:</h3>
            <p>{repair.customerFirstName} {repair.customerLastName}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-lg">Vendor Name</h3>
            <p>{repair.vendor}</p>
          </div>
        </div>

        {/* Item Table */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">ITEM #</th>
                <th className="text-left py-2 px-4">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4">{repair.itemNumber}</td>
                <td className="py-2 px-4">{repair.description}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Repair Issues */}
        <div className="mb-6">
          <h3 className="font-bold text-lg">Repair Issues</h3>
          <p>{repair.repairIssues || 'None specified'}</p>
        </div>

        {/* Repair Cost */}
        <div>
          <h3 className="font-bold text-lg">Repair Cost</h3>
          <p>${repair.repairCost ? repair.repairCost.toFixed(2) : '0.00'}</p>
        </div>
      </div>


      <div className="mb-4 flex justify-between items-center">

<div className="flex gap-2 mt-8">
  <Button variant="outline" className="flex items-center gap-1">
    <Printer className="h-4 w-4" />
    <span>Print</span>
  </Button>
  <Button asChild variant="outline" className="flex items-center gap-1">
    <Link href={`/dashboard/repairs/${repair.repairNumber}/edit`}>
      <Edit className="h-4 w-4" />
      <span>Edit</span>
    </Link>
  </Button>
  <Button variant="outline" className="flex items-center gap-1">
    <Mail className="h-4 w-4" />
    <span>EMail</span>
  </Button>
</div>
</div>
    </div>



  );
} 