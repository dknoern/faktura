"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LogActionMenu } from "./log-action-menu";
import { ImageGallery } from "@/components/image-gallery";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface ViewLogProps {
  log: Log;
  initialImages?: string[];
}

export function ViewLog({ log, initialImages = [] }: ViewLogProps) {

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
    <div className="container mx-auto px-8">

      <div className="bg-white p-8 rounded-lg shadow print:shadow-none">


        {/* Log Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Log Entry</h1>
          <LogActionMenu log={log} />
        </div>

        {/* Log Details */}
        <div className="grid gap-8 mb-8 space-y-6">
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Items Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Item Number</TableHead>
                    <TableHead>Repair Number</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.lineItems && log.lineItems.length > 0 ? (
                    log.lineItems.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">

                        <TableCell>
                          {item.name || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.itemNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {item.repairNumber || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.repairCost ? formatCurrency(item.repairCost) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No items logged
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Image Gallery */}
        {initialImages.length > 0 && (
          <ImageGallery images={initialImages} />
        )}
      </div>
    </div>
  );
}
