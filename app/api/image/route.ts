import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { UPLOADS_DIR } from '@/lib/utils/productImages';

export async function POST(request: Request) {
    try {
        const { action, filename } = await request.json();
        const filepath = path.join(UPLOADS_DIR, filename);

        switch (action) {
            case 'rotateLeft':
            case 'rotateRight': {
                const angle = action === 'rotateLeft' ? -90 : 90;
                const image = sharp(await fs.readFile(filepath));
                const buffer = await image.rotate(angle).toBuffer();
                await fs.writeFile(filepath, buffer);
                break;
            }
            case 'delete': {
                await fs.unlink(filepath);
                break;
            }
            default:
                throw new Error('Invalid action');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Image operation error:', error);
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }
}
