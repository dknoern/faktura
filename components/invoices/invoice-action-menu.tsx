"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ChevronDown, Printer, Mail, RotateCcw, Download } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Invoice } from "@/lib/invoice-renderer";
import { EmailDialog } from "./email-dialog";
import { handleDeviceAwarePrint } from "@/lib/utils/printing";
import { downloadInvoicePdf } from "@/lib/utils/pdf";

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
        handleDeviceAwarePrint(`/print/invoices/${invoice._id}`, undefined, invoice);
    };


    // Function to handle return
    const handleReturn = () => {
        router.push(`/returns/new?invoiceId=${invoice._id}`);
    };

    // Function to open email dialog
    const handleEmail = () => {
        setEmailDialogOpen(true);
    };

    // Function to download invoice as PDF
    const handleDownload = async () => {
        try {
            toast.loading('Generating PDF...', { id: 'pdf-download' });
            await downloadInvoicePdf(invoice.invoiceNumber);
            toast.success('PDF downloaded successfully', { id: 'pdf-download' });
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF', { id: 'pdf-download' });
        }
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

                <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
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
            invoiceNumber={invoice.invoiceNumber}
        />
        </>
    );
}
