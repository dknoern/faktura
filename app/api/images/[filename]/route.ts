import { NextResponse } from 'next/server';
import path from 'path';
import { getImage } from '@/lib/utils/storage';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const filename = (await params).filename;
        const imageBuffer = await getImage(filename);
        const contentType = path.extname(filename).toLowerCase() === '.png' 
            ? 'image/png' 
            : 'image/jpeg';
        
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return new NextResponse('Image not found', { status: 404 });
    }
}
