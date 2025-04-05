"use client"

import Image from 'next/image';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
    images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
    const [open, setOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (images.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Product Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <Dialog key={image} open={open && selectedImage === image} onOpenChange={(isOpen: boolean) => {
                        setOpen(isOpen);
                        if (!isOpen) setSelectedImage(null);
                    }}>
                        <DialogTrigger asChild>
                            <div className="relative cursor-pointer aspect-square">
                                <div className="absolute inset-0 border rounded-lg overflow-hidden hover:border-blue-500 transition-colors">
                                    <Image
                                        src={`/api/images?path=${encodeURIComponent(image)}`}
                                        alt={`Product image ${index + 1}`}
                                        fill
                                        className="object-contain"
                                        onClick={() => {
                                            setSelectedImage(image);
                                            setOpen(true);
                                        }}
                                    />
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-7xl w-full h-[90vh] p-0" title={`Product image ${index + 1} of ${images.length}`}>
                            <div className="relative w-full h-full">
                                <button
                                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                    onClick={() => setOpen(false)}
                                >
                                    <X className="h-6 w-6" />
                                </button>
                                {index > 0 && (
                                    <button
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                                        onClick={() => setSelectedImage(images[index - 1])}
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="h-8 w-8" />
                                    </button>
                                )}
                                {index < images.length - 1 && (
                                    <button
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                                        onClick={() => setSelectedImage(images[index + 1])}
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="h-8 w-8" />
                                    </button>
                                )}
                                <Image
                                    src={`/api/images?path=${encodeURIComponent(image)}`}
                                    alt={`Product image ${index + 1} of ${images.length}`}
                                    fill
                                    className="object-contain p-4"
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    );
}
