"use client";

import { RepairActionMenu } from "./repair-action-menu";
import { RepairImagesClient } from "./repair-images-client";
import { Repair, formatCurrency, formatDate } from "@/lib/repair-renderer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ViewRepairClientProps {
  repair: Repair;
  tenant: any;
  imageBaseUrl: string;
  images: string[];
}

export function ViewRepairClient({ repair, tenant, imageBaseUrl, images }: ViewRepairClientProps) {
  const customerName = `${repair.customerFirstName} ${repair.customerLastName}`.trim();

  return (
    <div className="container mx-auto py-1 px-4 max-w-4xl">
      {/* Header with Action Menu */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#B69D57' }}>
            REPAIR ORDER
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Repair #{repair.repairNumber}
          </p>
        </div>
        <RepairActionMenu repair={repair} />
      </div>

      <div className="space-y-6">
        {/* Repair Details */}
        <Card>
          <CardHeader>
            <CardTitle>Repair Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Repair #</label>
              <p className="text-sm font-bold">{repair.repairNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Repair Date</label>
              <p className="text-sm">{formatDate(repair.dateOut)}</p>
            </div>
            {repair.customerApprovedDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Approved Date</label>
                <p className="text-sm">{formatDate(repair.customerApprovedDate)}</p>
              </div>
            )}
            {repair.returnDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Return Date</label>
                <p className="text-sm">{formatDate(repair.returnDate)}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
              <p className="text-sm">{customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Vendor</label>
              <p className="text-sm">{repair.vendor || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Item Table */}
        <Card>
          <CardHeader>
            <CardTitle>Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">ITEM #</TableHead>
                    <TableHead className="font-bold">DESCRIPTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-bold">{repair.itemNumber || 'N/A'}</TableCell>
                    <TableCell>{repair.description || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Repair Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Repair Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{repair.repairIssues || 'None specified'}</p>
          </CardContent>
        </Card>

        {/* Repair Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Repair Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatCurrency(repair.repairCost)}</p>
          </CardContent>
        </Card>

        {/* Repair Notes */}
        {repair.repairNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Repair Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{repair.repairNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        {images.length > 0 && (
          <RepairImagesClient images={images} />
        )}
      </div>
    </div>
  );
}
