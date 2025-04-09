"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Printer, Mail, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Repair {
    repairNumber: string;
    itemNumber: string;
    description: string;
    dateOut: string | null;
    customerApprovedDate: string | null;
    returnDate: string | null;
    customerFirstName: string;
    customerLastName: string;
    vendor: string;
    repairCost: number;
    repairIssues: string;
}

export function ViewRepair({repair, tenant}:  {repair: Repair, tenant: any}) {
  // Unwrap the params Promise using React.use()
  const repairNumber = repair.repairNumber;
  
  const router = useRouter();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);


  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };
  
  // Function to navigate to edit page
  const handleEdit = () => {
    router.push(`/dashboard/repairs/${repairNumber}/edit`);
  };
  
  // Function to send email
  const handleEmail = async () => {
    setIsEmailSending(true);
    setEmailStatus(null);
    
    try {
      const response = await fetch('/api/email/send-repair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repairNumber,
          email: 'david@seattleweb.com',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEmailStatus('Email sent successfully!');
      } else {
        setEmailStatus(`Error: ${data.error || 'Failed to send email'}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus('Error: Failed to send email');
    } finally {
      setIsEmailSending(false);
    }
  };

  const getApiUrl = (tenantId: string) => {
    return `/api/images/logo-${tenantId}.png`;
  };

  const formattedDate = repair.dateOut
    ? new Date(repair.dateOut).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <div className="container mx-auto py-1 px-4 max-w-4xl">
      {/* Action Buttons (Top) */}
      <div className="flex justify-end gap-4 mb-4 print:hidden">
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handleEmail}
          disabled={isEmailSending}
        >
          <Mail className="h-4 w-4" />
          {isEmailSending ? 'Sending...' : 'Email'}
        </Button>
      </div>
      
      {/* Email Status Message */}
      {emailStatus && (
        <div className={`mb-4 p-2 rounded text-sm print:hidden ${emailStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {emailStatus}
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow print:shadow-none">
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
                unoptimized
                
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


      {/* Action Buttons (Bottom) */}
      <div className="flex justify-center gap-4 mt-6 print:hidden">
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handleEmail}
          disabled={isEmailSending}
        >
          <Mail className="h-4 w-4" />
          {isEmailSending ? 'Sending...' : 'Email'}
        </Button>
      </div>
    </div>



  );
} 