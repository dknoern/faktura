"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type Invoice = {
  _id: number;
  date: string;
  total: number;
  status: string;
  invoiceType: string;
  lineItems: Array<{
    productId: string;
    itemNumber: string;
    name: string;
    amount: number;
    serialNo?: string;
    longDesc?: string;
    included: boolean;
  }>;
};

type Repair = {
  repairNumber: string;
  dateOut: string;
  returnDate: string;
  description: string;
  repairIssues: string;
  repairCost: number;
  status?: string;
};

type Return = {
  _id: number;
  invoiceId: string;
  returnDate: string;
  customerId: number;
  customerName: string;
  totalReturnAmount: number;
  lineItems: Array<{
    productId: string;
    itemNumber: string;
    name: string;
    amount: number;
    serialNo?: string;
    longDesc?: string;
    included: boolean;
  }>;
};

export function CustomerRecordsTabs({ customerId }: { customerId: number }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [repairLoading, setRepairLoading] = useState(true);
  const [returnsLoading, setReturnsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoices");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}/invoices`);
        const data = await response.json();
        setInvoices(data.invoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setInvoiceLoading(false);
      }
    };

    const fetchRepairs = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}/repairs`);
        const data = await response.json();
        setRepairs(data.repairs);
      } catch (error) {
        console.error("Error fetching repairs:", error);
      } finally {
        setRepairLoading(false);
      }
    };

    const fetchReturns = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}/returns`);
        const data = await response.json();
        setReturns(data.returns);
      } catch (error) {
        console.error("Error fetching returns:", error);
      } finally {
        setReturnsLoading(false);
      }
    };

    if (customerId) {
      if (activeTab === "invoices") {
        fetchInvoices();
      } else if (activeTab === "repairs") {
        fetchRepairs();
      } else if (activeTab === "returns") {
        fetchReturns();
      }
    }
  }, [customerId, activeTab]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const navigateToInvoice = (invoiceId: number) => {
    router.push(`/dashboard/invoices/${invoiceId}/view`);
  };

  const navigateToRepair = (repairNumber: string) => {
    router.push(`/dashboard/repairs/${repairNumber}/view`);
  };

  const navigateToReturn = (returnId: number) => {
    router.push(`/dashboard/returns/${returnId}`);
  };

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xl font-bold tracking-tight">Customer Records</h3>
      <Tabs
        defaultValue="invoices"
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          {invoiceLoading ? (
            <div className="text-center py-4">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-4">No invoices found for this customer.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Item #</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow 
                      key={invoice._id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigateToInvoice(invoice._id)}
                    >
                      <TableCell className="font-medium">{invoice._id}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap' }}>{formatDate(invoice.date)}</TableCell>

                      
                      <TableCell>
                        {invoice.lineItems?.length ? (
                          <div className="whitespace-pre-line">
                            {invoice.lineItems.map(item => item.itemNumber).join('\n')}
                          </div>
                        ) : ''}
                      </TableCell>
                      <TableCell>
                        {invoice.lineItems?.length ? (
                          <div className="whitespace-pre-line">
                            {invoice.lineItems.map(item => item.name).join('\n')}
                          </div>
                        ) : ''}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>{invoice.invoiceType || "Invoice"}</TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="repairs" className="mt-4">
          {repairLoading ? (
            <div className="text-center py-4">Loading repairs...</div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-4">No repairs found for this customer.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repair #</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((repair) => (
                    <TableRow 
                      key={repair.repairNumber} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigateToRepair(repair.repairNumber)}
                    >
                      <TableCell className="font-medium">{repair.repairNumber}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap' }}>{formatDate(repair.dateOut)}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap' }}>{formatDate(repair.returnDate)}</TableCell>
                      <TableCell>{repair.description}</TableCell>
                      <TableCell>{repair.repairIssues}</TableCell>
                      <TableCell>{formatCurrency(repair.repairCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="returns" className="mt-4">
          {returnsLoading ? (
            <div className="text-center py-4">Loading returns...</div>
          ) : returns.length === 0 ? (
            <div className="text-center py-4">No returns found for this customer.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Refund Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((returnItem) => (
                    <TableRow 
                      key={returnItem._id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigateToReturn(returnItem._id)}
                    >
                      <TableCell className="font-medium">#{returnItem._id}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap' }}>{formatDate(returnItem.returnDate)}</TableCell>
                      <TableCell>
                        {returnItem.lineItems?.length ? (
                          <div className="whitespace-pre-line">
                            {returnItem.lineItems.map(item => item.name).join('\n')}
                          </div>
                        ) : 'No items'}
                      </TableCell>
                      <TableCell>{returnItem.lineItems?.[0]?.longDesc || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(returnItem.totalReturnAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
