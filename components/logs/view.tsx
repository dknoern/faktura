"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Mail, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface LineItem {
  itemNumber?: string;
  name?: string;
  repairNumber?: string;
  repairCost?: number;
  productId?: string;
  repairId?: string;
}

interface Log {
  id?: string;
  _id?: string;
  date: Date | string;
  receivedFrom: string;
  comments?: string;
  user?: string;
  customerName?: string;
  vendor?: string;
  search?: string;
  lineItems?: LineItem[];
}


export function ViewLog({ log }: { log: Log }) {
  const router = useRouter();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  // Function to navigate to edit page
  const handleEdit = () => {
    const logId = log.id || log._id;
    router.push(`/loginitems/${logId}/edit`);
  };

  // Function to send email
  const handleEmail = async () => {
    setIsEmailSending(true);
    setEmailStatus(null);

    try {
      const response = await fetch('/api/email/send-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logId: log.id || log._id,
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


  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 px-8 max-w-4xl">
      {/* Action Buttons */}
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

      {/* Email Status Message */}
      {emailStatus && (
        <div className={`mb-4 p-2 rounded text-sm print:hidden ${emailStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {emailStatus}
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow print:shadow-none">


        {/* Log Header */}
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{formatDateTime(log.date)}</h1>
        </div>

        {/* Log Details */}
        <div className="grid grid-cols-2 gap-8 mb-8 space-y-6">
          <div className="space-y-6">


            <Card>
              <CardHeader>
                <CardTitle>Log In Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">


                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="text-sm">{formatDateTime(log.date)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Received From</label>
                  <p className="text-sm">{log.receivedFrom}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Received By</label>
                  <p className="text-sm">{log.user}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                  <p className="text-sm">{log.customerName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                  <p className="text-sm">{log.vendor}</p>
                </div>

              </CardContent>
            </Card>



            {/* Comments */}
            {log.comments && (
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{log.comments}</p>
                </CardContent>
              </Card>
            )}
          </div>

        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Items Logged</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Item Number</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Repair Number</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {log.lineItems && log.lineItems.length > 0 ? (
                  log.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.itemNumber || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.name || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.repairNumber || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {item.repairCost ? formatCurrency(item.repairCost) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No items logged
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
