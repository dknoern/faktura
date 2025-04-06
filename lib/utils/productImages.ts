import fs from 'fs/promises';
import path from 'path';

export const UPLOADS_DIR = '/Users/davidk/Documents/demesy/backups/uploads';

export async function getProductImages(productId: string): Promise<string[]> {
    try {
        const files = await fs.readdir(UPLOADS_DIR);
        const productImages = files.filter(file => file.startsWith(productId));
        return productImages.map(file => path.join("/", file));
    } catch (error) {
        console.error('Error reading product images:', error);
        return [];
    }
}
