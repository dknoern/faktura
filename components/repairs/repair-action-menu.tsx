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
import { ChevronDown, Edit, Printer, Mail, ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Repair } from "@/lib/repair-renderer";
import { useState, useRef } from "react";
import { EmailDialog } from "./email-dialog";
import { UploadDialog } from "../upload-dialog";
import { handleDeviceAwarePrint } from "@/lib/utils/printing";
import { useDeviceDetection } from "@/hooks/use-device-detection";

interface RepairActionMenuProps {
    repair: Repair;
}

export function RepairActionMenu({ repair }: RepairActionMenuProps) {
    const router = useRouter();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isMobileOrTablet = useDeviceDetection();
    const mobileFileInputRef = useRef<HTMLInputElement>(null);

    const handleEdit = () => {
        router.push(`/repairs/${repair._id}/edit`);
    };

    const handlePrint = () => {
        handleDeviceAwarePrint(`/print/repairs/${repair._id}`, undefined, repair);
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
        if (isMobileOrTablet) {
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

    // Function to handle delete
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/repairs/${repair._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete repair');
            }

            // Show success message
            alert('Repair deleted successfully');
            
            window.location.href = '/repairs';
        } catch (error) {
            console.error('Error deleting repair:', error);
            alert('Failed to delete repair. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
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

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Repair</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete repair #{repair.repairNumber}?
                        {repair.description && (
                            <>
                                <br />
                                <strong>Description:</strong> {repair.description}
                            </>
                        )}
                        <br />
                        <br />
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
