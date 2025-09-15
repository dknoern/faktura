import { NextResponse } from 'next/server';
import { getRepairImages } from '@/lib/utils/storage';
import { fetchRepairs } from '@/lib/data';

interface Repair {
    _id: string;
    repairNumber: string;
    itemNumber: string;
    description: string;
    dateOut: string | null;
    customerApprovedDate: string | null;
    returnDate: string | null;
    customerFirstName: string;
    customerLastName: string;
    vendor: string;
    repairCost: number;
}

export async function GET() {
    try {
        // Fetch all open repairs (no returnDate)
        const { repairs } = await fetchRepairs(1, 1000, '', 'outstanding');

        // Fetch images for each repair in parallel
        const repairImagesPromises = repairs.map(async (repair: Repair) => {
            const images = await getRepairImages(repair._id);
            // Convert file paths to API URLs and get only the first image
            const imageUrls = images.map(imagePath => {
                const filename = imagePath.split('/').pop() || imagePath;
                return `/api/images/${filename}`;
            });
            
            return {
                repairId: repair._id,
                firstImage: imageUrls.length > 0 ? imageUrls[0] : null
            };
        });

        const repairImages = await Promise.all(repairImagesPromises);
        
        // Convert to a map for easy lookup
        const imageMap = repairImages.reduce((acc, item) => {
            if (item.firstImage) {
                acc[item.repairId] = item.firstImage;
            }
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json({ repairImages: imageMap });
    } catch (error) {
        console.error('Error fetching bulk repair images:', error);
        return NextResponse.json({ error: 'Failed to fetch repair images' }, { status: 500 });
    }
}
