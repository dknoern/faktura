"use client";

import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Printer, Edit, ImagePlus, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface OutActionMenuProps {
  out: {
    id?: string;
    _id?: string;
  };
  onSignatureClick?: () => void;
}

export function OutActionMenu({ out, onSignatureClick }: OutActionMenuProps) {
  const router = useRouter();
  const [isEmailSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    const outId = out.id || out._id;
    router.push(`/logoutitems/${outId}/edit`);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const outId = out.id || out._id;
      if (!outId) {
        throw new Error("Out ID is required");
      }
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", outId);

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
          <DropdownMenuItem onClick={onSignatureClick}>
            <PenLine className="mr-2 h-4 w-4" />
            e-Sign
          </DropdownMenuItem>
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
    </>
  );
}
