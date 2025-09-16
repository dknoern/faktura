import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';
import { saveImage } from '@/lib/utils/storage';



export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const id = formData.get('id') as string;

        if (!file || !id) {
            return NextResponse.json({ error: 'File and ID are required' }, { status: 400 });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const originalName = path.basename(file.name);
        let newFileName = `${id}-${timestamp}-${originalName}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process image with Sharp - add error handling for metadata
        let image = sharp(buffer);
        let metadata;
        try {
            metadata = await image.metadata();
            console.log('Image metadata:', metadata);
        } catch (metadataError) {
            console.error('Failed to read image metadata:', metadataError);
            // If we can't read metadata, save the raw buffer without processing
            await saveImage(buffer, newFileName);
            return NextResponse.json({ success: true, fileName: newFileName });
        }
        
        // Convert WebP to JPEG if needed (Sharp may not support WebP in all environments)
        if (metadata.format === 'webp') {
            console.log('Converting WebP to JPEG');
            image = image.jpeg({ quality: 90 });
            // Update filename extension to .jpg
            const nameWithoutExt = newFileName.replace(/\.[^/.]+$/, "");
            newFileName = `${nameWithoutExt}.jpg`;
        }
        
        // If image is larger than 2000px in any dimension, resize it
        if (metadata.width && metadata.width > 2000 || metadata.height && metadata.height > 2000) {
            const resizedImage = await image
                .resize(2000, 2000, {
                    fit: 'inside', // Maintain aspect ratio
                    withoutEnlargement: true // Don't enlarge if smaller
                })
                .toBuffer();
            await saveImage(resizedImage, newFileName);
        } else {
            const processedBuffer = await image.toBuffer();
            await saveImage(processedBuffer, newFileName);
        }

        return NextResponse.json({ success: true, fileName: newFileName });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
