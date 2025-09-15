import { NextResponse } from 'next/server';
import { getRepairImages } from '@/lib/utils/storage';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const images = await getRepairImages(id);
        
        // Convert file paths to API URLs
        const imageUrls = images.map(imagePath => {
            const filename = imagePath.split('/').pop() || imagePath;
            return `/api/images/${filename}`;
        });
        
        return NextResponse.json({ images: imageUrls });
    } catch (error) {
        console.error('Error fetching repair images:', error);
        return NextResponse.json({ error: 'Failed to fetch repair images' }, { status: 500 });
    }
}
