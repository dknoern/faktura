import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/Users/davidk/Documents/demesy/backups/uploads';
export const IMAGE_BUCKET = process.env.IMAGE_BUCKET;

// Initialize S3 client if bucket is configured
const s3Client = IMAGE_BUCKET ? new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
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

export async function saveFile(buffer: Buffer, fileName: string): Promise<void> {
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

export async function deleteImage(fileName: string): Promise<void> {
    if (IMAGE_BUCKET && s3Client) {
        // Delete from S3
        await s3Client.send(new DeleteObjectCommand({
            Bucket: IMAGE_BUCKET,
            Key: fileName
        }));
    } else {
        // Delete from file system
        const filePath = path.join(UPLOADS_DIR, fileName);
        await fs.unlink(filePath);
    }
}

export async function deleteFile(fileName: string): Promise<void> {
    if (IMAGE_BUCKET && s3Client) {
        // Delete from S3
        await s3Client.send(new DeleteObjectCommand({
            Bucket: IMAGE_BUCKET,
            Key: fileName
        }));
    } else {
        // Delete from file system
        const filePath = path.join(UPLOADS_DIR, fileName);
        await fs.unlink(filePath);
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
        const filePath = path.join(UPLOADS_DIR, fileName);
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
        case '.gif':
            return 'image/gif';
        case '.webp':
            return 'image/webp';
        case '.pdf':
            return 'application/pdf';
        case '.doc':
            return 'application/msword';
        case '.docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.xls':
            return 'application/vnd.ms-excel';
        case '.xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case '.txt':
            return 'text/plain';
        default:
            return 'application/octet-stream';
    }
}


export async function getProductImages(productId: string): Promise<string[]> {

    if (IMAGE_BUCKET && s3Client) {
        // Get from S3
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: IMAGE_BUCKET,
            Prefix: productId
        }));
        
        if (!response.Contents) {
            return [];
        }
        
        return response.Contents.map(item => item.Key || '');
    }
    else {
        // Get from file system
        try {
            const files = await fs.readdir(UPLOADS_DIR);
            const productImages = files.filter(file => file.startsWith(productId));
            return productImages.map(file => path.join("/", file));
        } catch (error) {
            console.error('Error reading product images:', error);
            return [];
        }
    }
}

export async function getRepairImages(repairId: string): Promise<string[]> {
    if (IMAGE_BUCKET && s3Client) {
        // Get from S3
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: IMAGE_BUCKET,
            Prefix: repairId
        }));
        
        if (!response.Contents) {
            return [];
        }
        
        return response.Contents.map(item => item.Key || '');
    }
    else {
        // Get from file system
        try {
            const files = await fs.readdir(UPLOADS_DIR);
            const repairImages = files.filter(file => file.startsWith(repairId));
            return repairImages.map(file => path.join("/", file));
        } catch (error) {
            console.error('Error reading repair images:', error);
            return [];
        }
    }
}

export async function getOutImages(outId: string): Promise<string[]> {
    if (IMAGE_BUCKET && s3Client) {
        // Get from S3
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: IMAGE_BUCKET,
            Prefix: outId
        }));
        
        if (!response.Contents) {
            return [];
        }
        
        return response.Contents.map(item => item.Key || '');
    }
    else {
        // Get from file system
        try {
            const files = await fs.readdir(UPLOADS_DIR);
            const outImages = files.filter(file => file.startsWith(outId));
            return outImages.map(file => path.join("/", file));
        } catch (error) {
            console.error('Error reading out images:', error);
            return [];
        }
    }
}

export async function getLogImages(logId: string): Promise<string[]> {
    if (IMAGE_BUCKET && s3Client) {
        // Get from S3
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: IMAGE_BUCKET,
            Prefix: logId
        }));
        
        if (!response.Contents) {
            return [];
        }
        
        return response.Contents.map(item => item.Key || '');
    }
    else {
        // Get from file system
        try {
            const files = await fs.readdir(UPLOADS_DIR);
            const logImages = files.filter(file => file.startsWith(logId));
            return logImages.map(file => path.join("/", file));
        } catch (error) {
            console.error('Error reading log images:', error);
            return [];
        }
    }
}


export async function imageAction(action: 'rotateLeft' | 'rotateRight' | 'delete', filename: string) {

        switch (action) {
            case 'rotateLeft':
            case 'rotateRight': {
                const angle = action === 'rotateLeft' ? -90 : 90;
                const imageBuffer = await getImage(filename);
                const image = sharp(imageBuffer);
                const buffer = await image.rotate(angle).toBuffer();
                await saveImage(buffer, filename);
                break;
            }
            case 'delete': {
                await deleteImage(filename);
                break;
            }
            default:
                throw new Error('Invalid action');
        }


}
