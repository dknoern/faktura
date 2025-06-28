"use client";

import * as React from "react";
import Image from "next/image";
import { Repair, Tenant, generateRepairHtml } from "@/lib/repair-renderer";
import { RepairActionMenu } from "./repair-action-menu";

export function ViewRepair({repair, tenant}:  {repair: Repair, tenant: Tenant}) {

  const getApiUrl = (tenantId: string | number | undefined) => {
    return `/api/images/logo-${tenantId || 'default'}.png`;
  };

  return (
    <div className="container mx-auto py-1 px-4 max-w-4xl">
      {/* Action Menu */}
      <div className="flex justify-end gap-4 mb-4 print:hidden">
        <RepairActionMenu repair={repair} />
      </div>

      <div className="bg-white p-7 rounded-lg shadow print:shadow-none">
        {/* Header with Logo */}
        <div className="mb-4">
          <div className="flex flex-col items-start">
            <div className="w-48 mb-0">
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



    </div>



  );
} 