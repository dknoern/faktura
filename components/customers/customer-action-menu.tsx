"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ChevronDown, Paperclip } from "lucide-react";
import { customerSchema } from "@/lib/models/customer";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttachmentUploadDialog } from "./attachment-upload-dialog";

type Customer = z.infer<typeof customerSchema>;

interface CustomerActionMenuProps {
    customer: Customer;
    onAttachmentUpload?: () => void;
}

export function CustomerActionMenu({ customer, onAttachmentUpload }: CustomerActionMenuProps) {
    const router = useRouter();
    const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);

    const handleEdit = () => {
        router.push(`/customers/${customer._id}/edit`);
    };

    const handleAddAttachment = () => {
        setShowAttachmentDialog(true);
    };

    const handleAttachmentUploadComplete = () => {
        onAttachmentUpload?.();
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
                </DropdownMenuContent>
            </DropdownMenu>

            <AttachmentUploadDialog
                customerId={customer._id.toString()}
                open={showAttachmentDialog}
                onOpenChange={setShowAttachmentDialog}
                onUploadComplete={handleAttachmentUploadComplete}
            />
        </>
    );
}
