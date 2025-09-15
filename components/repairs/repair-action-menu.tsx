"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, Printer, Mail, ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Repair } from "@/lib/repair-renderer";
import { useState, useRef, useEffect } from "react";
import { EmailDialog } from "./email-dialog";
import { UploadDialog } from "../upload-dialog";

interface RepairActionMenuProps {
    repair: Repair;
}

export function RepairActionMenu({ repair }: RepairActionMenuProps) {
    const router = useRouter();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const mobileFileInputRef = useRef<HTMLInputElement>(null);

    // Detect if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsMobile(isMobileDevice || (isTouchDevice && window.innerWidth < 768));
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const handleEdit = () => {
        router.push(`/repairs/${repair._id}/edit`);
    };

    const handlePrint = () => {
        // Create hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0';
        
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
            // Wait a moment for content to fully load, then print
            setTimeout(() => {
                try {
                    iframe.contentWindow?.print();
                } catch (error) {
                    console.error('Print failed:', error);
                    // Fallback to opening in new tab if iframe printing fails
                    window.open(`/repairs/${repair._id}/print`, '_blank');
                }
                
                // Clean up iframe after printing
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        };
        
        iframe.src = `/repairs/${repair._id}/print`;
    };
    
    const handleMobileFileUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('id', repair._id);
            formData.append('type', 'repair');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            // Reload the page to show the new image
            window.location.reload();
        } catch (error) {
            console.error('Error uploading:', error);
            alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };
    
    const handleAddImageClick = () => {
        if (isMobile) {
            // On mobile, go straight to camera
            mobileFileInputRef.current?.click();
        } else {
            // On desktop, show upload dialog
            setShowUploadDialog(true);
        }
    };

    // Function to open email dialog
    const handleEmail = () => {
        setEmailDialogOpen(true);
    };

    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                >
                    Action
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleAddImageClick}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Add Image
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Upload dialog for desktop */}
        <UploadDialog
            id={repair._id}
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onUploadComplete={() => {
                setShowUploadDialog(false);
                window.location.reload();
            }}
        />
        
        {/* Hidden input for mobile camera */}
        <input
            type="file"
            ref={mobileFileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    handleMobileFileUpload(file);
                }
                // Reset the input to allow selecting the same file again
                e.target.value = '';
            }}
        />
        
        <EmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            repairId={repair._id}
        />
        </>
    );
}
