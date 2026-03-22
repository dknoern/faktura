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

interface InvoiceActionMenuProps {
    invoice: Invoice;
}

export function InvoiceActionMenu({ invoice }: InvoiceActionMenuProps) {
    const router = useRouter();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);

    const handleEdit = () => {
        router.push(`/invoices/${invoice._id}/edit`);
    };

    const handlePrint = async () => {
        try {
            toast.loading('Preparing to print...', { id: 'pdf-print' });

            const response = await fetch(`/api/invoices/${invoice._id}/pdf`);
            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Use a hidden iframe to trigger print without opening a new tab
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.style.top = '-9999px';
            document.body.appendChild(iframe);

            iframe.src = url;
            iframe.onload = () => {
                toast.dismiss('pdf-print');
                iframe.contentWindow?.print();
                // Clean up after a short delay to allow print dialog to fully close
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 1000);
            };
        } catch (error) {
            console.error('Error printing PDF:', error);
            toast.error('Failed to print PDF', { id: 'pdf-print' });
        }
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

            const response = await fetch(`/api/invoices/${invoice._id}/pdf`);
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

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
        />
        </>
    );
}
