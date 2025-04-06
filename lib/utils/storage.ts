import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = '/Users/davidk/Documents/demesy/backups/uploads';
const IMAGE_BUCKET = process.env.IMAGE_BUCKET;

// Initialize S3 client if bucket is configured
const s3Client = IMAGE_BUCKET ? new S3Client({
    region: process.env.AWS_REGION || 'us-west-2'
}) : null;

export async function saveImage(buffer: Buffer, fileName: string): Promise<void> {
    if (IMAGE_BUCKET && s3Client) {
        // Save to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: IMAGE_BUCKET,
            Key: fileName,
            Body: buffer,
            ContentType: getContentType(fileName)
        }));
    } else {
        // Save to file system
        const filePath = path.join(UPLOADS_DIR, fileName);
        await writeFile(filePath, buffer);
    }
}

export async function getImage(fileName: string): Promise<Buffer> {
    if (IMAGE_BUCKET && s3Client) {
        // Get from S3
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: IMAGE_BUCKET,
            Key: fileName
        }));
        
        if (!response.Body) {
            throw new Error('Image not found in S3');
        }
        
        return Buffer.from(await response.Body.transformToByteArray());
    } else {
        // Get from file system
        console.log('fileName=', fileName);
        console.log('UPLOADS_DIR=', UPLOADS_DIR);
        const filePath = path.join(UPLOADS_DIR, fileName);
        console.log('filePath=', filePath);
        return readFile(filePath);
    }
}

function getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        default:
            return 'application/octet-stream';
    }
}
