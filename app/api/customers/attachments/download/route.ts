import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/utils/storage';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');
        const originalName = searchParams.get('originalName');

        if (!fileName) {
            return NextResponse.json({ error: 'File name is required' }, { status: 400 });
        }

        // Get file from storage
        const fileBuffer = await getImage(fileName);

        // Determine content type based on file extension
        const getContentType = (fileName: string): string => {
            const ext = fileName.toLowerCase().split('.').pop();
            switch (ext) {
                case 'pdf': return 'application/pdf';
                case 'doc': return 'application/msword';
                case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                case 'xls': return 'application/vnd.ms-excel';
                case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                case 'txt': return 'text/plain';
                case 'jpg':
                case 'jpeg': return 'image/jpeg';
                case 'png': return 'image/png';
                case 'gif': return 'image/gif';
                case 'webp': return 'image/webp';
                default: return 'application/octet-stream';
            }
        };

        const contentType = getContentType(fileName);
        const downloadName = originalName || fileName;

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${downloadName}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error downloading attachment:', error);
        return NextResponse.json({ error: 'Failed to download attachment' }, { status: 500 });
    }
}
