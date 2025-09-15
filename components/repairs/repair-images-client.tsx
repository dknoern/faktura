"use client";

import { ImageGallery } from "@/components/image-gallery";

interface RepairImagesClientProps {
  images: string[];
}

export function RepairImagesClient({ images }: RepairImagesClientProps) {
  return <ImageGallery images={images} />;
}
