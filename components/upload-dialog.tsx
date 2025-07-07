"use client"

import { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDialogProps {    id: string;
    onUploadComplete?: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ id, onUploadComplete, open, onOpenChange }: UploadDialogProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    
    // Detect if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsMobile(isMobileDevice || (isTouchDevice && window.innerWidth < 768));
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

            onUploadComplete?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const addFilesToStaging = (files: File[]) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please select only image files');
            return;
        }
        
        // Add new files to staging, avoiding duplicates based on name and size
        setStagedFiles(prev => {
            const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
            const newFiles = imageFiles.filter(f => !existing.has(`${f.name}-${f.size}`));
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
                formData.append('id', id);

                const response = await fetch('/api/upload', {
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
            onOpenChange(false);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const captureImage = async () => {
        if (!videoRef.current || !videoRef.current.videoWidth) {
            console.error('Video not ready');
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Flip horizontally if using front camera
            if (stream?.getVideoTracks()[0].getSettings().facingMode === 'user') {
                ctx.scale(-1, 1);
                ctx.translate(-canvas.width, 0);
            }

            ctx.drawImage(videoRef.current, 0, 0);
            
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });

            if (!blob) {
                throw new Error('Failed to create image blob');
            }

            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            await handleFileUpload(file);
            stopCamera();
        } catch (error) {
            console.error('Error capturing image:', error);
            alert('Failed to capture image');
        }
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
        
        // Force a small reflow/repaint
        void document.body.offsetHeight;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                stopCamera();
                clearStagedFiles();
                // Force reset any lingering scroll locks
                resetBodyStyles();
                
                // Use window.location.reload as a last resort if needed
                // Uncomment the next line if the issue persists
                // window.location.reload();
            }
            onOpenChange(isOpen);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle>Upload Image</DialogTitle>
                <div className="grid gap-4">
                    {!showCamera ? (
                        <div className="space-y-4">
                            {/* Desktop: Drag and drop zone */}
                            {!isMobile && (
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
                                            <FileImage className="w-full h-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-lg font-medium">
                                                {dragActive ? "Drop images here" : "Drag & drop images here"}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                or click to browse files
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Supports multiple image files
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Mobile: Camera button */}
                            {isMobile && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        className="w-full max-w-xs"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Take Photo
                                    </Button>
                                </div>
                            )}
                            

                            
                            {/* Staged files section */}
                            {!isMobile && stagedFiles.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium">Selected Images ({stagedFiles.length})</h4>
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
                                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                                            {isUploading ? 'Uploading...' : `Upload ${stagedFiles.length} Image${stagedFiles.length !== 1 ? 's' : ''}`}
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
                                        <span>Uploading images...</span>
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
                    ) : (
                        <div className="space-y-4">
                            <div className="relative aspect-video">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full rounded-lg bg-black"
                                    style={{ transform: 'scaleX(-1)' }} /* Mirror the video for front camera */
                                    onLoadedMetadata={(e) => {
                                        const video = e.target as HTMLVideoElement;
                                        video.play().catch(e => {
                                            console.error('Error playing video in component:', e);
                                        });
                                    }}
                                    onPlay={() => console.log('Video started playing')}
                                    onError={(e) => console.error('Video element error:', e)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" onClick={stopCamera}>
                                    Cancel
                                </Button>
                                <Button onClick={captureImage} disabled={isUploading}>
                                    Capture
                                </Button>
                            </div>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple={!isMobile}
                        capture={isMobile ? "environment" : undefined}
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                                if (isMobile && files.length === 1) {
                                    // On mobile, upload single file immediately
                                    handleFileUpload(files[0]);
                                } else {
                                    // On desktop or multiple files, stage them
                                    addFilesToStaging(Array.from(files));
                                }
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
