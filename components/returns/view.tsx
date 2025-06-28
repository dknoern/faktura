"use client";

import * as React from "react";
import Image from "next/image";
import { ReturnActionMenu } from "./return-action-menu";

interface LineItem {
  productId?: string;
  itemNumber: string;
  name?: string;
  amount: number;
  serialNo?: string;
  longDesc?: string;
  included: boolean;
}

interface Return {
  _id: string;
  customerName: string;
  customerId?: number;
  invoiceId: string;
  returnDate: string;
  subTotal: number;
  taxable: boolean;
  salesTax: number;
  shipping: number;
  totalReturnAmount: number;
  salesPerson?: string;
  lineItems: LineItem[];
}

interface Tenant {
  _id: string | number;
  nameLong?: string;
  nameShort?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export function ViewReturn({ returnData, tenant }: { returnData: Return, tenant: Tenant }) {

  const getApiUrl = (tenantId: string | number | undefined) => {
    return `/api/images/logo-${tenantId || 'default'}.png`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      {/* Action Menu */}
      <div className="flex justify-end gap-4 mb-4 print:hidden">
        <ReturnActionMenu returnData={returnData} />
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow print:shadow-none">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex flex-col items-start">
            <div className="w-48 mb-4">
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

        {/* Return Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">RETURN AUTHORIZATION</h1>
          <div className="text-lg text-gray-600">
            Return #{returnData._id}
          </div>
        </div>

        {/* Return Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Return Information</h2>
            <div className="space-y-2">
              <div><strong>Return Date:</strong> {formatDate(returnData.returnDate)}</div>
              <div><strong>Invoice ID:</strong> {returnData.invoiceId}</div>
              <div><strong>Customer:</strong> {returnData.customerName}</div>
              {returnData.salesPerson && (
                <div><strong>Sales Person:</strong> {returnData.salesPerson}</div>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Company Information</h2>
            <div className="space-y-1 text-sm">
              <div className="font-medium">{tenant.nameLong}</div>
              {tenant.address1 && <div>{tenant.address1}</div>}
              {tenant.address2 && <div>{tenant.address2}</div>}
              {(tenant.city || tenant.state || tenant.zip) && (
                <div>
                  {tenant.city && tenant.city}
                  {tenant.city && tenant.state && ', '}
                  {tenant.state && tenant.state}
                  {tenant.zip && ` ${tenant.zip}`}
                </div>
              )}
              {tenant.phone && <div>Phone: {tenant.phone}</div>}
              {tenant.email && <div>Email: {tenant.email}</div>}
              {tenant.website && <div>Website: {tenant.website}</div>}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Returned Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Item Number</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {returnData.lineItems && returnData.lineItems.length > 0 ? (
                  returnData.lineItems.map((item, index) => (
                    <tr key={index} className={!item.included ? 'bg-gray-50 text-gray-500' : ''}>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={!item.included ? 'line-through' : ''}>
                          {item.itemNumber}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={!item.included ? 'line-through' : ''}>
                          {item.name || item.longDesc || '-'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <span className={!item.included ? 'line-through' : ''}>
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.included 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.included ? 'Included' : 'Excluded'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No items in this return
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Summary */}
        <div className="flex justify-end">
          <div className="w-80">
            <div className="border border-gray-300 rounded">
              <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800">
                Return Summary
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(returnData.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(returnData.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(returnData.salesTax)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taxable:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    returnData.taxable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {returnData.taxable ? 'Yes' : 'No'}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Return Amount:</span>
                  <span>{formatCurrency(returnData.totalReturnAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
