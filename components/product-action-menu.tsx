"use client"

import { useState, useRef } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Printer, ImagePlus, FileText } from "lucide-react";
import { CustomerSelectModalWrapper } from "./customers/select-modal-wrapper";

interface ProductActionMenuProps {
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

export function ProductActionMenu({ id, onUploadComplete, customers = [], pagination = { total: 0, pages: 1, currentPage: 1, limit: 10 } }: ProductActionMenuProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileUpload = async (file: File) => {
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('id', id);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            // Show success notification
            console.log(`Upload successful: ${file.name}`);
            // You could implement a custom notification here if needed
            
            onUploadComplete?.();
        } catch (error) {
            console.error('Error uploading:', error);
            // Show error notification
            console.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            // You could implement a custom notification here if needed
        } finally {
            setIsUploading(false);
        }
    };
    
    // Trigger native camera for image capture
    const captureImage = () => {
        if (imageInputRef.current) {
            imageInputRef.current.click();
        }
    };
    
    // Handle customer selection for invoice creation
    const handleCustomerSelect = (customer: any) => {
        setShowCustomerSelectModal(false);
        
        // Force reset any lingering scroll locks
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        // Use window.location for a full page navigation instead of router.push
        // This ensures a complete page refresh and proper scroll behavior
        window.location.href = `/dashboard/invoices/new?customerId=${customer._id}&productId=${id}`;
    };
    
    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                    disabled={isUploading}
                >
                    Action
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={captureImage} className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Add Image
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
        {/* Hidden input for capturing images */}
        <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    handleFileUpload(file);
                }
                // Reset the input to allow selecting the same file again
                e.target.value = '';
            }}
            disabled={isUploading}
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
