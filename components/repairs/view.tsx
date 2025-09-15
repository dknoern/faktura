"use client";

import * as React from "react";
import { Repair, Tenant } from "@/lib/repair-renderer";
import { RepairActionMenu } from "./repair-action-menu";

interface ViewRepairProps {
  repair: Repair;
  tenant: Tenant;
  imageBaseUrl: string;
  initialHtml: string;
}

export function ViewRepair({ repair, initialHtml }: ViewRepairProps) {
  return (
    <div className="container mx-auto py-1 px-4 max-w-4xl">
      {/* Action Menu */}
      <div className="flex justify-end gap-4 mb-4 print:hidden">
        <RepairActionMenu repair={repair} />
      </div>
      <div className="bg-white p-7 rounded-lg shadow print:shadow-none">
        {/* Repair Content */}
        <div dangerouslySetInnerHTML={{ __html: initialHtml }} />
      </div>
    </div>
  );
} 