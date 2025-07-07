"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, Printer, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Repair } from "@/lib/repair-renderer";
import { useState } from "react";
import { EmailDialog } from "./email-dialog";

interface RepairActionMenuProps {
    repair: Repair;
}

export function RepairActionMenu({ repair }: RepairActionMenuProps) {
    const router = useRouter();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);

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
        
        <EmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            repairId={repair._id}
        />
        </>
    );
}
