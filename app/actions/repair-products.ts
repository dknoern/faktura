'use server';

import { productModel } from '@/lib/models/product';
import { Repair } from '@/lib/models/repair';
import dbConnect from '@/lib/dbConnect';

// Function to search inventory items that are not currently in repair
export async function searchAvailableProducts(search: string = '') {
  try {
    await dbConnect();
    
    // First, get all items that are currently in repair and don't have a return date
    const repairsInProgress = await Repair.find({ 
      returnDate: null 
    }).select('itemNumber');
    
    // Extract the item numbers from repairs in progress
    const itemsInRepair = repairsInProgress.map(repair => repair.itemNumber);
    
    // Build the query to find products that are not in repair
    const query: any = {};
    
    // Add search condition if provided
    
    
    
    if (search) {
      query.search = { $regex: search, $options: 'i' };
    }
    
    // Add condition to exclude items that are in repair
    if (itemsInRepair.length > 0) {
      query.itemNumber = { $nin: itemsInRepair };
    }
    
    const products = await productModel.find(query)
      .sort({ lastUpdated: -1 })
      .limit(20);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(products)) 
    };
  } catch (error) {
    console.error('Error searching available products:', error);
    return { success: false, error: 'Failed to search available products' };
  }
}
