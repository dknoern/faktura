import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const imagePath = searchParams.get('path');

    if (!imagePath) {
        return new NextResponse('Image path is required', { status: 400 });
    }

    // Validate that the path is within the allowed directory
    const allowedDir = process.env.UPLOADS_DIR || './uploads';
    const normalizedPath = path.normalize(imagePath);
    
    if (!normalizedPath.startsWith(allowedDir)) {
        return new NextResponse('Invalid image path', { status: 403 });
    }

    try {
        const imageBuffer = await fs.readFile(normalizedPath);
        const contentType = path.extname(normalizedPath).toLowerCase() === '.png' 
            ? 'image/png' 
            : 'image/jpeg';

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error) {
        console.error('Error reading image:', error);
        return new NextResponse('Image not found', { status: 404 });
    }
}
