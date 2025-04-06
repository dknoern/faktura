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
        const newFileName = `${id}-${timestamp}-${originalName}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process image with Sharp
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
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
            await saveImage(buffer, newFileName);
        }

        return NextResponse.json({ success: true, fileName: newFileName });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
