"use client"

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Printer, ImagePlus } from "lucide-react";
import { UploadDialog } from "./upload-dialog";

interface ActionMenuProps {
    id: string;
    onUploadComplete?: () => void;
}

export function ActionMenu({ id, onUploadComplete }: ActionMenuProps) {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
                    Action
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setShowUploadDialog(true)} className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Add Images
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => window.print()} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <UploadDialog
            id={id}
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onUploadComplete={onUploadComplete}
        />
        </>
    );
}
