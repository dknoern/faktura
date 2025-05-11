"use client"

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Printer, ImagePlus, FileText } from "lucide-react";
import { UploadDialog } from "./upload-dialog";
import { CustomerSelectModalWrapper } from "./customers/select-modal-wrapper";
import { useRouter } from "next/navigation";

interface ActionMenuProps {
    id: string;
    onUploadComplete?: () => void;
    customers?: any[];
    pagination?: {
        total: number;
        pages: number;
        currentPage: number;
        limit: number;
    };
}

export function ActionMenu({ id, onUploadComplete, customers = [], pagination = { total: 0, pages: 1, currentPage: 1, limit: 10 } }: ActionMenuProps) {
    const router = useRouter();
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
    
    // Handle customer selection for invoice creation
    const handleCustomerSelect = (customer: any) => {
        setShowCustomerSelectModal(false);
        // Navigate to the new invoice page with both customer ID and product ID
        router.push(`/dashboard/invoices/new?customerId=${customer._id}&productId=${id}`);
    };
    
    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
                    Action
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setShowUploadDialog(true)} className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Add Images
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => window.print()} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setShowCustomerSelectModal(true)} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: "#B69D57" }} />
                    Create Invoice
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <UploadDialog
            id={id}
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onUploadComplete={onUploadComplete}
        />
        {/* Customer selection modal for invoice creation */}
        <CustomerSelectModalWrapper
            isOpen={showCustomerSelectModal}
            onClose={() => setShowCustomerSelectModal(false)}
            onSelect={handleCustomerSelect}
            customers={customers}
            pagination={pagination}
        />
        </>
    );
}
