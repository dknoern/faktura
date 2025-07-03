"use client"

import Image from 'next/image';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ImageGalleryProps {
    images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
    const [open, setOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    // Convert absolute paths to API URLs
    const getApiUrl = (absolutePath: string) => {
        const filename = absolutePath.split('/').pop();
        // Use path as version to ensure unique URL after rotation
        return `/api/images/${filename}?v=${encodeURIComponent(absolutePath)}`;
    };

    const [localImages, setLocalImages] = useState<string[]>(images.map(getApiUrl));

    const handleImageAction = async (action: 'rotateLeft' | 'rotateRight' | 'delete', imagePath: string) => {
        try {
            // Remove any query parameters and get the filename
            const filename = imagePath.split('/api/images/').pop()?.split('?')[0];
            if (!filename) return;

            const response = await fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, filename })
            });

            if (!response.ok) {
                throw new Error('Failed to process image');
            }

            if (action === 'delete') {
                setLocalImages(prev => prev.filter(img => img !== imagePath));
                if (selectedImage === imagePath) {
                    setSelectedImage(null);
                }
            } else {
                // Force a refresh of the image by adding a timestamp query parameter
                const timestamp = Date.now();
                const newImages = localImages.map(img => {
                    if (img === imagePath) {
                        // Remove any existing timestamp query
                        const baseUrl = img.split('?')[0];
                        return `${baseUrl}?t=${timestamp}`;
                    }
                    return img;
                });
                setLocalImages(newImages);

                // Update the selected image if it was the one rotated
                if (selectedImage === imagePath) {
                    const baseUrl = imagePath.split('?')[0];
                    setSelectedImage(`${baseUrl}?t=${timestamp}`);
                }
            }
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image');
        }
    };

    if (images.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>

                <div className="grid grid-cols-3 gap-4">
                    {localImages.map((image, index) => (
                        <Dialog key={image} open={open && selectedImage === image} onOpenChange={(isOpen: boolean) => {
                            setOpen(isOpen);
                            if (!isOpen) setSelectedImage(null);
                        }}>
                            <DialogTrigger asChild onClick={() => {
                                setSelectedImage(image);
                                setOpen(true);
                            }}>
                                <div className="group relative aspect-square cursor-pointer">
                                    <Image
                                        src={image}
                                        alt="Product image"
                                        fill
                                        className="object-cover rounded-lg"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        {/*<span className="text-white">Click to view</span>*/}
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
                                {/* Hidden DialogTitle for accessibility */}
                                <DialogTitle className="sr-only">Product Image {index + 1}</DialogTitle>
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <button
                                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                        onClick={() => setOpen(false)}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                    {index > 0 && (
                                        <button
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                                            onClick={() => setSelectedImage(localImages[index - 1])}
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="h-8 w-8" />
                                        </button>
                                    )}
                                    {index < images.length - 1 && (
                                        <button
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                                            onClick={() => setSelectedImage(localImages[index + 1])}
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="h-8 w-8" />
                                        </button>
                                    )}
                                    <div className="relative w-full h-full flex flex-col items-center">
                                        <div className="relative w-full flex-1">
                                            <Image
                                                src={image}
                                                alt={`Product image ${index + 1} of ${localImages.length}`}
                                                fill
                                                className="object-contain p-4"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="w-full p-4 bg-gray-50 flex justify-center gap-4">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleImageAction('rotateLeft', image)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleImageAction('rotateRight', image)}
                                            >
                                                <RotateCw className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-red-600 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this image?')) {
                                                        handleImageAction('delete', image);
                                                        setOpen(false);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
