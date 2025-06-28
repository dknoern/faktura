"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Mail, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Out {
  id?: string;
  _id?: string;
  date: Date | string;
  sentTo: string;
  description: string;
  comments?: string;
  user?: string;
  signature?: string;
  signatureDate?: Date | string;
  signatureUser?: string;
}


export function ViewOut({ out }: { out: Out }) {
  const router = useRouter();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };
  
  // Function to navigate to edit page
  const handleEdit = () => {
    const outId = out.id || out._id;
    router.push(`/logoutitems/${outId}/edit`);
  };
  
  // Function to send email
  const handleEmail = async () => {
    setIsEmailSending(true);
    setEmailStatus(null);
    
    try {
      const response = await fetch('/api/email/send-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outId: out.id || out._id,
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

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            Log Out Entry
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Sent to {out.sentTo}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2" 
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2" 
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2" 
            onClick={handleEmail}
            disabled={isEmailSending}
          >
            <Mail className="h-4 w-4" />
            {isEmailSending ? 'Sending...' : 'Email'}
          </Button>
        </div>
      </div>

      {/* Email Status Message */}
      {emailStatus && (
        <div className={`p-3 rounded-md ${emailStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {emailStatus}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Log Out Details */}
        <Card>
          <CardHeader>
            <CardTitle>Log Out Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
              <p className="text-sm">{formatDateTime(out.date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sent To</label>
              <p className="text-sm">{out.sentTo}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{out.description}</p>
            </div>
            {out.user && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Logged By</label>
                <p className="text-sm">{out.user}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Information */}
        {(out.signature || out.signatureDate || out.signatureUser) && (
          <Card>
            <CardHeader>
              <CardTitle>Signature Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {out.signature && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signature</label>
                  <p className="text-sm">{out.signature}</p>
                </div>
              )}
              {out.signatureDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signature Date</label>
                  <p className="text-sm">{formatDateTime(out.signatureDate)}</p>
                </div>
              )}
              {out.signatureUser && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signed By</label>
                  <p className="text-sm">{out.signatureUser}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comments */}
      {out.comments && (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{out.comments}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
