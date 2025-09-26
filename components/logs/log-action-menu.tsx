"use client";

import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Button } from "@/components/ui/button";
import { ChevronDown, Printer, Edit, ImagePlus} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface LogActionMenuProps {
  log: {
    id?: string;
    _id?: string;
    receivedFrom?: string;
    date?: string | Date;
  };
}

export function LogActionMenu({ log }: LogActionMenuProps) {
  const router = useRouter();
  const [isEmailSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    const logId = log.id || log._id;
    if (!logId) {
      console.error('Log ID is required for printing');
      return;
    }
    
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
          window.open(`/loginitems/${logId}/print`, '_blank');
        }
        
        // Clean up iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
    
    iframe.src = `/loginitems/${logId}/print`;
  };

  const handleEdit = () => {
    const logId = log.id || log._id;
    router.push(`/loginitems/${logId}/edit`);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const logId = log.id || log._id;
      if (!logId) {
        throw new Error("Log ID is required");
      }
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", logId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success(`Upload successful: ${file.name}`);
      window.location.reload();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const captureImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  // Function to handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const logId = log.id || log._id;
      if (!logId) {
        throw new Error('Log ID is required');
      }

      const response = await fetch(`/api/logs/${logId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete log');
      }

      // Show success message
      alert('Log deleted successfully');
      
      // Reload to /loginitems page
      window.location.href = '/loginitems';
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isEmailSending || isUploading}>
            Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={captureImage}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Add Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>

          {/*<DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>*/}
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
          e.target.value = "";
        }}
        disabled={isUploading}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Log Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this log entry?
              {log.receivedFrom && (
                <>
                  <br />
                  <strong>Received From:</strong> {log.receivedFrom}
                </>
              )}
              {log.date && (
                <>
                  <br />
                  <strong>Date:</strong> {new Date(log.date).toLocaleDateString()}
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
