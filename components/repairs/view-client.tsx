"use client";

import { useState, useEffect } from "react";
import { RepairActionMenu } from "./repair-action-menu";
import { generateRepairHtml } from "@/lib/repair-renderer";
import { RepairImagesClient } from "./repair-images-client";

interface ViewRepairClientProps {
  repair: any;
  tenant: any;
  imageBaseUrl: string;
  images: string[];
}

export function ViewRepairClient({ repair, tenant, imageBaseUrl, images }: ViewRepairClientProps) {
  const [repairHtml, setRepairHtml] = useState<string>("");
  
  useEffect(() => {
    // Generate HTML only on client to avoid hydration issues
    const html = generateRepairHtml(repair, tenant, imageBaseUrl, true);
    setRepairHtml(html);
  }, [repair, tenant, imageBaseUrl]);

  return (
    <div className="container mx-auto py-1 px-4 max-w-4xl">
      {/* Action Menu */}
      <div className="flex justify-end gap-4 mb-4 print:hidden">
        <RepairActionMenu repair={repair} />
      </div>
      {repairHtml ? (
        <div className="bg-white p-7 rounded-lg shadow print:shadow-none">
          {/* Repair Content - Client Rendered */}
          <div dangerouslySetInnerHTML={{ __html: repairHtml }} />
        </div>
      ) : (
        <div className="bg-white p-7 rounded-lg shadow print:shadow-none">
          <div className="text-center text-gray-500">Loading repair details...</div>
        </div>
      )}
      <RepairImagesClient images={images} />
    </div>
  );
}
