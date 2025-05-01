'use server';

import { productModel } from '@/lib/models/product';
import { Repair } from '@/lib/models/repair';
import dbConnect from '@/lib/dbConnect';

// Function to search inventory items
export async function searchInventoryItems(search: string = '') {
  try {
    await dbConnect();
    
    const query = search 
      ? { search: { $regex: search, $options: 'i' } }
      : {};
    
    const products = await productModel.find(query)
      .sort({ lastUpdated: -1 })
      .limit(20);
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(products)) 
    };
  } catch (error) {
    console.error('Error searching inventory items:', error);
    return { success: false, error: 'Failed to search inventory items' };
  }
}

// Function to search repair items
export async function searchOutstandingRepairs(search: string = '') {
  try {
    await dbConnect();


    let query = { $and: [
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
