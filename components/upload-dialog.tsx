"use client"

import { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

interface UploadDialogProps {    id: string;
    onUploadComplete?: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ id, onUploadComplete, open, onOpenChange }: UploadDialogProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

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

    const startCamera = async () => {
        try {
            // First check if we can access the camera
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Camera API not available');
            }

            // Set showCamera first to ensure video element is rendered
            setShowCamera(true);

            // Wait a moment for the video element to be available
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!videoRef.current) {
                throw new Error('Video element not ready');
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' }  // Prefer rear camera
                },
                audio: false
            });

            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);

        } catch (error) {
            console.error('Error accessing camera:', error);
            setShowCamera(false); // Hide camera UI if there's an error
            alert('Failed to access camera: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Device
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={startCamera}
                                disabled={isUploading}
                            >
                                <Camera className="mr-2 h-4 w-4" />
                                Camera
                            </Button>
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
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                handleFileUpload(file);
                            }
                        }}
                        disabled={isUploading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
