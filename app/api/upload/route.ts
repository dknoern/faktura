import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = '/Users/davidk/Documents/demesy/backups/uploads';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const id = formData.get('id') as string;

        if (!file || !id) {
            return NextResponse.json({ error: 'File and ID are required' }, { status: 400 });
        }

        const timestamp = Date.now();
        const fileExtension = path.extname(file.name);
        const newFileName = `${id}_${timestamp}${fileExtension}`;
        const filePath = path.join(UPLOADS_DIR, newFileName);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(filePath, buffer);

        return NextResponse.json({ success: true, fileName: newFileName });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
