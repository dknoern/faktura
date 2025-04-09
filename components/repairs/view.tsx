"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Printer, Mail, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Repair, Tenant, generateRepairHtml } from "@/lib/repair-renderer";

export function ViewRepair({repair, tenant}:  {repair: Repair, tenant: Tenant}) {
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

  const getApiUrl = (tenantId: string | number | undefined) => {
    return `/api/images/logo-${tenantId || 'default'}.png`;
  };

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
                alt={tenant.nameLong || ''}
                width={300}
                height={80}
                className="w-full"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Repair Content */}
        <div dangerouslySetInnerHTML={{ __html: generateRepairHtml(repair, tenant) }} />

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