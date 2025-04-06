import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { UPLOADS_DIR } from '@/lib/utils/productImages';


export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const url = new URL(request.url);
    try {
        const filePath = path.join(UPLOADS_DIR, (await params).filename);
        const fileStats = await fs.stat(filePath);
        const fileBuffer = await fs.readFile(filePath);
        
        // Determine content type based on file extension
        const ext = path.extname((await params).filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        
        return new NextResponse(fileBuffer, {
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
