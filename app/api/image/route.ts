import { NextResponse } from 'next/server';
import { imageAction } from '@/lib/utils/storage';

export async function POST(request: Request) {
    try {
        const { action, filename } = await request.json();

        await imageAction(action, filename);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Image operation error:', error);
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }
}
