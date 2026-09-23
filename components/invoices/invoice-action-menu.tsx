"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, ChevronDown, Printer, Mail, RotateCcw, Download, CreditCard, Send, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Invoice, invoiceTypeLabel } from "@/lib/invoice-renderer";
import { deleteInvoice } from "@/lib/actions/invoice-actions";
import { EmailDialog } from "./email-dialog";
import { EsignRequestDialog } from "@/components/esign/esign-request-dialog";

interface InvoiceActionMenuProps {
    invoice: Invoice;
    paymentsEnabled?: boolean;
    onRecordPayment?: () => void;
    /** Sum of payments recorded against this invoice; a paid invoice can't be deleted. */
    totalPaid?: number;
}

export function InvoiceActionMenu({ invoice, paymentsEnabled = false, onRecordPayment, totalPaid = 0 }: InvoiceActionMenuProps) {
    const router = useRouter();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [esignDialogOpen, setEsignDialogOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = () => {
        router.push(`/invoices/${invoice._id}/edit`);
    };

    const handlePrint = () => {
        window.open(`/api/invoices/${invoice._id}/pdf`, '_blank');
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


    const isPaid = totalPaid > 0;

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteInvoice(invoice._id.toString());
            if (result.success) {
                toast.success('Invoice deleted');
                router.push('/invoices');
            } else {
                toast.error(result.error ?? 'Failed to delete invoice');
                setShowDeleteDialog(false);
            }
        } finally {
            setIsDeleting(false);
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

                <DropdownMenuItem onClick={() => setEsignDialogOpen(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Request e-Sign
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleReturn}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Create Return
                </DropdownMenuItem>

                {paymentsEnabled && (
                    <DropdownMenuItem onClick={onRecordPayment}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Record Payment
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isPaid}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
                {isPaid && (
                    <p className="max-w-[15rem] px-2 pb-1 text-xs text-muted-foreground">
                        Paid invoices can&apos;t be deleted. Remove the payments first.
                    </p>
                )}

            </DropdownMenuContent>
        </DropdownMenu>
        
        <EmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            invoiceId={invoice._id.toString()}
            defaultEmail={invoice.customerEmail}
        />

        <EsignRequestDialog
            open={esignDialogOpen}
            onOpenChange={setEsignDialogOpen}
            type="invoice"
            id={invoice._id.toString()}
            defaultEmail={invoice.customerEmail}
            docLabel={invoiceTypeLabel(invoice.invoiceType)}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete invoice #{invoice.invoiceNumber}? It will
                        be removed from invoice lists and sales reports, and any items it sold
                        will go back to In Stock. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
