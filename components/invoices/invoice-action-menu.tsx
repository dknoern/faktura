"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ChevronDown, Printer, Mail, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/lib/invoice-renderer";
import { EmailDialog } from "./email-dialog";

interface InvoiceActionMenuProps {
    invoice: Invoice;
}

export function InvoiceActionMenu({ invoice }: InvoiceActionMenuProps) {
    const router = useRouter();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);

    const handleEdit = () => {
        router.push(`/invoices/${invoice._id}/edit`);
    };

    const handlePrint = () => {
        window.print();
    };


    // Function to handle return
    const handleReturn = () => {
        router.push(`/returns/new?invoiceId=${invoice._id}`);
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


                <DropdownMenuItem onClick={handleReturn}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Create Return
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
        
        <EmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            invoiceId={invoice._id.toString()}
        />
        </>
    );
}
