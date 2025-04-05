"use client"

import Image from 'next/image';
import { useState } from 'react';

interface ImageGalleryProps {
    images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(images[0] || null);

    if (images.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Product Images</h3>
            <div className="space-y-4">
                {selectedImage && (
                    <div className="relative w-full h-96 border rounded-lg overflow-hidden">
                        <Image
                            src={`/api/images?path=${encodeURIComponent(selectedImage)}`}
                            alt="Selected product image"
                            fill
                            className="object-contain"
                        />
                    </div>
                )}
                <div className="grid grid-cols-6 gap-2">
                    {images.map((image, index) => (
                        <div
                            key={image}
                            className={`relative aspect-square border rounded-md overflow-hidden cursor-pointer ${
                                selectedImage === image ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => setSelectedImage(image)}
                        >
                            <Image
                                src={`/api/images?path=${encodeURIComponent(image)}`}
                                alt={`Product image ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
