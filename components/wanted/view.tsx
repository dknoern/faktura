"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WantedActionMenu } from "./wanted-action-menu";


interface Wanted {
  _id: string;
  title: string;
  description: string;
  customerName: string;
  customerId: number;
  createdDate: string;
  foundDate: string | null;
  createdBy?: string;
  foundBy?: string;
}

interface ViewWantedProps {
  wanted: Wanted;

}

export function ViewWanted({ wanted }: ViewWantedProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{wanted.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Wanted by {wanted.customerName} • Created {formatDate(wanted.createdDate)}
          </p>
        </div>
        <WantedActionMenu wanted={wanted} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wanted Information */}
        <Card>
          <CardHeader>
            <CardTitle>Wanted Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <p className="text-sm">{wanted.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{wanted.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Customer</label>
              <p className="text-sm">{wanted.customerName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle>Status Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  wanted.foundDate 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {wanted.foundDate ? 'Found' : 'Wanted'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created Date
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(wanted.createdDate).toLocaleDateString()}
                </p>
              </div>
              {wanted.createdBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <p className="text-sm text-gray-900">
                    {wanted.createdBy}
                  </p>
                </div>
              )}
              {wanted.foundDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Found Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(wanted.foundDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {wanted.foundBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Found By
                  </label>
                  <p className="text-sm text-gray-900">
                    {wanted.foundBy}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
