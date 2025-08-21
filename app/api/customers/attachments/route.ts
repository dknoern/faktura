import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { customerModel } from '@/lib/models/customer';
import dbConnect from '@/lib/dbConnect';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const customerId = formData.get('customerId') as string;

        if (!file || !customerId) {
            return NextResponse.json({ error: 'File and customer ID are required' }, { status: 400 });
        }

        await dbConnect();

        const timestamp = Math.floor(Date.now() / 1000);
        const originalName = file.name;
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const newFileName = `attachment-${customerId}-${timestamp}-${baseName}${extension}`;
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save file to storage (using existing storage utility)
        const { saveFile } = await import('@/lib/utils/storage');
        await saveFile(buffer, newFileName);

        // Create attachment record
        const attachmentData = {
            fileName: newFileName,
            originalName: originalName,
            uploadDate: new Date(),
            fileSize: file.size,
            mimeType: file.type,
        };

        // Update customer with new attachment
        await customerModel.findByIdAndUpdate(
            customerId,
            {
                $push: { attachments: attachmentData },
                $set: { lastUpdated: new Date() }
            },
            { new: true }
        );

        return NextResponse.json({ 
            success: true, 
            fileName: newFileName,
            attachment: attachmentData
        });
    } catch (error) {
        console.error('Error uploading attachment:', error);
        return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');
        const fileName = searchParams.get('fileName');

        if (!customerId || !fileName) {
            return NextResponse.json({ error: 'Customer ID and file name are required' }, { status: 400 });
        }

        await dbConnect();

        // Remove attachment from customer record
        await customerModel.findByIdAndUpdate(
            customerId,
            {
                $pull: { attachments: { fileName: fileName } },
                $set: { lastUpdated: new Date() }
            }
        );

        // Delete file from storage
        const { deleteFile } = await import('@/lib/utils/storage');
        await deleteFile(fileName);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
    }
}
