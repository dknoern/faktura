"use client"

import { useRef, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Printer, ImagePlus } from "lucide-react";

interface ActionMenuProps {
    id: string;
    onUploadComplete?: () => void;
}

export function LogActionMenu({ id, onUploadComplete }: ActionMenuProps) {
    const [isUploading, setIsUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (file: File) => {
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('id', id);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            // Show success notification
            console.log(`Upload successful: ${file.name}`);
            // You could implement a custom notification here if needed
            
            onUploadComplete?.();
        } catch (error) {
            console.error('Error uploading:', error);
            // Show error notification
            console.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            // You could implement a custom notification here if needed
        } finally {
            setIsUploading(false);
        }
    };

    // Trigger native camera for image capture
    const captureImage = () => {
        if (imageInputRef.current) {
            imageInputRef.current.click();
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                        disabled={isUploading}
                    >
                        Action
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={captureImage} className="flex items-center gap-2">
                        <ImagePlus className="h-4 w-4" />
                        Add Image
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => window.print()} className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        Print
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
                    e.target.value = '';
                }}
                disabled={isUploading}
            />
        </>
    );
}