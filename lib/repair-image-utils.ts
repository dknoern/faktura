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
