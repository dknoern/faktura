'use server';

import { productModel } from '@/lib/models/product';
import { Repair } from '@/lib/models/repair';
import dbConnect from '@/lib/dbConnect';


// Function to search repair items
export async function searchOutstandingRepairs(search: string = '') {
  try {
    await dbConnect();


    const query = { $and: [
      {'search': new RegExp(search, 'i')},
      {'returnDate':{$eq:null}}
    ] };

    const repairs = await Repair.find(query)
      .sort({ _id: -1 })
      .limit(20);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(repairs)) 
    };
  } catch (error) {
    console.error('Error searching repair items:', error);
    return { success: false, error: 'Failed to search repair items' };
  }
}

// Function to get inventory item by ID
export async function getInventoryItemById(id: string) {
  try {
    await dbConnect();
    
    const product = await productModel.findById(id);
    
    if (!product) {
      return { success: false, error: 'Inventory item not found' };
    }
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(product)) 
    };
  } catch (error) {
    console.error('Error getting inventory item:', error);
    return { success: false, error: 'Failed to get inventory item' };
  }
}

// Function to get repair item by ID
export async function getRepairItemById(id: string) {
  try {
    await dbConnect();
    
    const repair = await Repair.findById(id);
    
    if (!repair) {
      return { success: false, error: 'Repair item not found' };
    }
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(repair)) 
    };
  } catch (error) {
    console.error('Error getting repair item:', error);
    return { success: false, error: 'Failed to get repair item' };
  }
}

// Function to search for products with specific statuses with pagination
export async function searchFilteredInventoryItems(
  search: string = '', 
  statuses: string[] = ["Sold", "Memo", "Incoming"],
  page: number = 1,
  limit: number = 10
) {
  try {
    await dbConnect();
    
    // Build the query to find products with specific statuses
    const query: any = {
      $and: [
        { status: { $in: statuses } },
        // someday we should delete all the bad records
        { itemNumber: { $ne: null } }, // Exclude items with null itemNumber
        { itemNumber: { $ne: '' } }, // Exclude items with empty itemNumber
        { title: { $ne: null } } // Exclude items with null title
    ]
    };
    
    // Add search condition if provided
    if (search) {
      query.search = { $regex: search, $options: 'i' };
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await productModel.countDocuments(query);
    
    // Get products with pagination
    const products = await productModel.find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit);
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(products)),
      pagination: {
        total,
        pages,
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    console.error('Error searching filtered status products:', error);
    return { success: false, error: 'Failed to search products with filtered status' };
  }
}
