'use server';

import { productModel } from '@/lib/models/product';
import { Repair } from '@/lib/models/repair';
import dbConnect from '@/lib/dbConnect';
import { getShortUser } from '@/lib/auth-utils';


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

// Function to update a product history note
export async function updateProductHistoryNote(productId: string, historyIndex: number, newNote: string) {
  try {
    await dbConnect();
    
    // Get current user
    const user = await getShortUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get the product first to validate the history index
    const product = await productModel.findById(productId);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    if (!product.history || historyIndex < 0 || historyIndex >= product.history.length) {
      return { success: false, error: 'Invalid history index' };
    }
    
    // Update the specific history entry
    const updateQuery: any = {};
    updateQuery[`history.${historyIndex}.action`] = newNote;
    updateQuery[`history.${historyIndex}.date`] = new Date(); // Update timestamp
    
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { $set: updateQuery },
      { 
        new: true,
        runValidators: false
      }
    );
    
    if (!updatedProduct) {
      return { success: false, error: 'Failed to update product history' };
    }
    
    // Return the updated entry
    const updatedEntry = {
      date: updatedProduct.history[historyIndex].date.toISOString(),
      user: updatedProduct.history[historyIndex].user,
      action: updatedProduct.history[historyIndex].action
    };
    
    return { 
      success: true, 
      data: updatedEntry
    };
  } catch (error) {
    console.error('Error updating product history note:', error);
    return { success: false, error: 'Failed to update note in product history' };
  }
}

// Function to add a note to product history
export async function addProductHistoryNote(productId: string, note: string) {
  try {
    await dbConnect();
    
    // Get current user
    const user = await getShortUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Create new history entry with proper Date object
    const newHistoryEntry = {
      date: new Date(),
      user: user,
      action: note
    };
    
    // Use findByIdAndUpdate to add the history entry without triggering full validation
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { 
        $push: { 
          history: newHistoryEntry 
        }
      },
      { 
        new: true,
        runValidators: false // Skip validation to avoid id field requirement
      }
    );
    
    if (!updatedProduct) {
      return { success: false, error: 'Product not found' };
    }
    
    // Return the entry with ISO string date for consistency with frontend
    const returnEntry = {
      date: newHistoryEntry.date.toISOString(),
      user: newHistoryEntry.user,
      action: newHistoryEntry.action
    };
    
    return { 
      success: true, 
      data: returnEntry
    };
  } catch (error) {
    console.error('Error adding product history note:', error);
    return { success: false, error: 'Failed to add note to product history' };
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
