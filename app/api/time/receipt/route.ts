import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getImage } from '@/lib/utils/storage';
import { timeEntryModel } from '@/lib/models/time';
import dbConnect from '@/lib/dbConnect';
import { getTenantObjectId } from '@/lib/tenant-utils';
import { contentDispositionHeader } from '@/lib/utils/content-disposition';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entryId = searchParams.get('entryId');

        if (!entryId) {
            return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
        }

        await dbConnect();
        // Prefer the session tenant claim; header-based context is unreliable
        // outside proxied JSON posts
        const session = await auth();
        const sessionTenantId = (session?.user as any)?.tenantId;
        const tenantObjectId = sessionTenantId
            ? new mongoose.Types.ObjectId(String(sessionTenantId))
            : await getTenantObjectId();
        const entry = await timeEntryModel.findOne({ _id: entryId, tenantId: tenantObjectId });
        if (!entry?.receipt?.fileName) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
        }

        const fileBuffer = await getImage(entry.receipt.fileName);
        const contentType = entry.receipt.mimeType || 'application/octet-stream';
        const downloadName = entry.receipt.originalName || entry.receipt.fileName;

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': contentDispositionHeader('inline', downloadName),
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error downloading receipt:', error);
        const detail = process.env.NODE_ENV === 'development' && error instanceof Error
            ? `: ${error.message}`
            : '';
        return NextResponse.json({ error: `Failed to download receipt${detail}` }, { status: 500 });
    }
}
