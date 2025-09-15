/**
 * Utility functions for uploading images to repairs
 */

/**
 * Uploads an image to a repair using the repair ID
 */
export async function uploadImageToRepair(repairId: string, file: File): Promise<boolean> {
  try {
    console.log("Uploading image to repair", repairId)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", repairId);

    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.error('Error uploading image to repair:', error);
    return false;
  }
}

/**
 * Server-side function to upload base64 images to a repair
 * This works in Node.js environments where File constructor is not available
 */
export async function uploadBase64ImagesToRepair(repairId: string, base64Images: string[]): Promise<{
  success: boolean;
  uploadedCount: number;
  totalCount: number;
}> {
  let uploadedCount = 0;
  
  for (let i = 0; i < base64Images.length; i++) {
    try {
      const base64Data = base64Images[i];
      
      // Extract the base64 content and mime type from data URL
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.error(`Invalid base64 data for image ${i + 1}`);
        continue;
      }
      
      const mimeType = matches[1];
      const base64Content = matches[2];
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Content, 'base64');
      
      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: mimeType });
      
      // Create FormData with the blob
      const formData = new FormData();
      formData.append("file", blob, `repair-${repairId}-image-${i + 1}.jpg`);
      formData.append("id", repairId);
      
      // Use absolute URL for server-side fetch
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        uploadedCount++;
      } else {
        console.error(`Failed to upload image ${i + 1} for repair ${repairId}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error uploading image ${i + 1} to repair:`, error);
    }
  }
  
  return {
    success: uploadedCount > 0,
    uploadedCount,
    totalCount: base64Images.length
  };
}

/**
 * Uploads multiple images to a repair
 */
export async function uploadImagesToRepair(repairId: string, files: File[]): Promise<{
  success: boolean;
  uploadedCount: number;
  totalCount: number;
}> {
  let uploadedCount = 0;
  
  for (const file of files) {
    const success = await uploadImageToRepair(repairId, file);
    if (success) {
      uploadedCount++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    success: uploadedCount > 0,
    uploadedCount,
    totalCount: files.length
  };
}
