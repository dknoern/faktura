"use client";

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
import { Edit, ChevronDown, Paperclip, FileText, Wrench, Gift, Trash2 } from "lucide-react";
import { customerSchema } from "@/lib/models/customer";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttachmentUploadDialog } from "./attachment-upload-dialog";
import { deleteCustomer } from "@/lib/actions/customer-actions";
import { toast } from "react-hot-toast";

type Customer = z.infer<typeof customerSchema>;

interface CustomerActionMenuProps {
    customer: Customer;
    onAttachmentUpload?: () => void;
}

export function CustomerActionMenu({ customer, onAttachmentUpload }: CustomerActionMenuProps) {
    const router = useRouter();
    const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = () => {
        router.push(`/customers/${customer._id}/edit`);
    };

    const handleAddAttachment = () => {
        setShowAttachmentDialog(true);
    };

    const handleAttachmentUploadComplete = () => {
        onAttachmentUpload?.();
    };

    const handleNewInvoice = () => {
        router.push(`/invoices/new?customerId=${customer._id}`);
    };

    const handleNewRepair = () => {
        router.push(`/repairs/new?customerId=${customer._id}`);
    };

    const handleNewWanted = () => {
        router.push(`/wanted/new?customerId=${customer._id}`);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteCustomer(customer._id.toString());
            if (result.success) {
                router.push('/customers');
            } else {
                toast.error(result.error ?? "Failed to delete customer");
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
                    <DropdownMenuItem onClick={handleAddAttachment}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Add Attachment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNewInvoice}>
                        <FileText className="mr-2 h-4 w-4" />
                        New Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNewRepair}>
                        <Wrench className="mr-2 h-4 w-4" />
                        New Repair
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNewWanted}>
                        <Gift className="mr-2 h-4 w-4" />
                        New Wanted
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AttachmentUploadDialog
                customerId={customer._id.toString()}
                open={showAttachmentDialog}
                onOpenChange={setShowAttachmentDialog}
                onUploadComplete={handleAttachmentUploadComplete}
            />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {customer.firstName} {customer.lastName}? This action cannot be undone.
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
