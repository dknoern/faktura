"use client"

import { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentUploadDialogProps {
    customerId: string;
    onUploadComplete?: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AttachmentUploadDialog({ customerId, onUploadComplete, open, onOpenChange }: AttachmentUploadDialogProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFilesToStaging = (files: File[]) => {
        // Accept common document types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        
        const validFiles = files.filter(file => allowedTypes.includes(file.type));
        
        if (validFiles.length === 0) {
            alert('Please select valid document files (PDF, Word, Excel, Text, or Image files)');
            return;
        }
        
        if (validFiles.length !== files.length) {
            alert(`${files.length - validFiles.length} file(s) were skipped due to unsupported file type`);
        }
        
        // Add new files to staging, avoiding duplicates based on name and size
        setStagedFiles(prev => {
            const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
            const newFiles = validFiles.filter(f => !existing.has(`${f.name}-${f.size}`));
            return [...prev, ...newFiles];
        });
    };
    
    const removeFileFromStaging = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };
    
    const clearStagedFiles = () => {
        setStagedFiles([]);
    };

    const handleBulkFileUpload = async () => {
        if (stagedFiles.length === 0) return;
        
        try {
            setIsUploading(true);
            setUploadProgress(0);
            const fileNames = stagedFiles.map(f => f.name);
            setUploadingFiles(fileNames);
            
            let completed = 0;
            const total = stagedFiles.length;
            
            // Upload files sequentially to avoid overwhelming the server
            for (const file of stagedFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('customerId', customerId);
                formData.append('type', 'attachment');

                const response = await fetch('/api/customers/attachments', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }
                
                completed++;
                setUploadProgress((completed / total) * 100);
                
                // Remove completed file from the list
                setUploadingFiles(prev => prev.filter(name => name !== file.name));
            }

            // Clear staged files and close dialog
            setStagedFiles([]);
            onUploadComplete?.();
            
            // Force cleanup before closing
            const resetBodyStyles = () => {
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
                document.body.style.removeProperty('pointer-events');
                document.documentElement.style.removeProperty('overflow');
                document.documentElement.style.removeProperty('padding-right');
                document.documentElement.style.removeProperty('pointer-events');
                document.body.style.overflow = 'auto';
                document.body.style.pointerEvents = 'auto';
                document.documentElement.style.overflow = 'auto';
                document.documentElement.style.pointerEvents = 'auto';
                void document.body.offsetHeight;
            };
            
            resetBodyStyles();
            setTimeout(resetBodyStyles, 0);
            setTimeout(resetBodyStyles, 100);
            
            onOpenChange(false);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert(`Failed to upload attachments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadingFiles([]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            addFilesToStaging(files);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Fix for scrolling issues - ensure body scroll is restored
    useEffect(() => {
        // Function to reset all scroll locks and pointer events
        const resetBodyStyles = () => {
            // Remove all scroll locks
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
            
            // Ensure pointer events are enabled
            document.body.style.removeProperty('pointer-events');
            
            // Remove any other potential locks that might be applied
            document.documentElement.style.removeProperty('overflow');
            document.documentElement.style.removeProperty('padding-right');
            document.documentElement.style.removeProperty('pointer-events');
            
            // Explicitly set to ensure interaction works
            document.body.style.overflow = 'auto';
            document.body.style.pointerEvents = 'auto';
            document.documentElement.style.overflow = 'auto';
            document.documentElement.style.pointerEvents = 'auto';
            
            // Force a small reflow/repaint
            void document.body.offsetHeight;
        };
        
        // When dialog closes, ensure body scroll is enabled
        if (!open) {
            // Immediate reset
            resetBodyStyles();
            
            // Additional resets with timeouts to catch any delayed effects
            setTimeout(resetBodyStyles, 0);
            setTimeout(resetBodyStyles, 100);
            setTimeout(resetBodyStyles, 300);
        }
        
        // Cleanup on unmount
        return () => {
            resetBodyStyles();
        };
    }, [open]);

    // Function to reset all scroll locks and pointer events
    const resetBodyStyles = () => {
        // Remove all scroll locks
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        // Ensure pointer events are enabled
        document.body.style.removeProperty('pointer-events');
        
        // Remove any other potential locks that might be applied
        document.documentElement.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('padding-right');
        document.documentElement.style.removeProperty('pointer-events');
        
        // Explicitly set to ensure interaction works
        document.body.style.overflow = 'auto';
        document.body.style.pointerEvents = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.pointerEvents = 'auto';
        
        // Force a small reflow/repaint
        void document.body.offsetHeight;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                clearStagedFiles();
                // Force reset any lingering scroll locks
                resetBodyStyles();
                
                // Additional cleanup with slight delay
                setTimeout(resetBodyStyles, 0);
                setTimeout(resetBodyStyles, 100);
            }
            onOpenChange(isOpen);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle>Upload Attachment</DialogTitle>
                <div className="grid gap-4">
                    <div className="space-y-4">
                        {/* Drag and drop zone */}
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                                dragActive 
                                    ? "border-primary bg-primary/5" 
                                    : "border-gray-300 hover:border-gray-400",
                                isUploading && "opacity-50 pointer-events-none"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="space-y-4">
                                <div className="mx-auto w-12 h-12 text-gray-400">
                                    <FileText className="w-full h-full" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-medium">
                                        {dragActive ? "Drop files here" : "Drag & drop files here"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        or click to browse files
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Supports PDF, Word, Excel, Text, and Image files
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Staged files section */}
                        {stagedFiles.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Selected Files ({stagedFiles.length})</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearStagedFiles}
                                        disabled={isUploading}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-2">
                                    {stagedFiles.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFileFromStaging(index)}
                                                disabled={isUploading}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleBulkFileUpload}
                                        disabled={isUploading || stagedFiles.length === 0}
                                        className="flex-1"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {isUploading ? 'Uploading...' : `Upload ${stagedFiles.length} File${stagedFiles.length !== 1 ? 's' : ''}`}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={clearStagedFiles}
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                        {/* Upload progress */}
                        {isUploading && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Uploading files...</span>
                                    <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <Progress value={uploadProgress} className="w-full" />
                                {uploadingFiles.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500">Remaining files:</p>
                                        <div className="max-h-20 overflow-y-auto space-y-1">
                                            {uploadingFiles.map((fileName, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                                    <span className="truncate">{fileName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                        multiple
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                                addFilesToStaging(Array.from(files));
                            }
                            // Reset the input to allow selecting the same files again
                            e.target.value = "";
                        }}
                        disabled={isUploading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
