"use server";

import dbConnect from "@/lib/dbConnect";
import { productModel } from "@/lib/models/product";
import { getShowReport } from "@/lib/reports";
import { getShortUserFromToken } from "../auth-utils";

export async function bulkEntryToShow(itemNumbers: string[]) {
  try {
    await dbConnect();
    
    // Clean and filter item numbers
    const cleanItemNumbers = itemNumbers
      .map(num => num.trim())
      .filter(num => num.length > 0);

    console.log('DEBUG: Received item numbers:', itemNumbers);
    console.log('DEBUG: Clean item numbers:', cleanItemNumbers);

    if (cleanItemNumbers.length === 0) {
      throw new Error("No valid item numbers provided");
    }

    // Find all products by item numbers (regardless of current status)
    // Try both string and number queries in case of type mismatch
    const stringQuery = await productModel.find({
      itemNumber: { $in: cleanItemNumbers }
    });
    
    const numberQuery = await productModel.find({
      itemNumber: { $in: cleanItemNumbers.map(num => parseInt(num)).filter(num => !isNaN(num)) }
    });
    
    // Combine results and remove duplicates
    const allProductsMap = new Map();
    [...stringQuery, ...numberQuery].forEach(product => {
      allProductsMap.set(product._id.toString(), product);
    });
    const allProducts = Array.from(allProductsMap.values());
    
    console.log('DEBUG: String query results:', stringQuery.map(p => ({ itemNumber: p.itemNumber, status: p.status })));
    console.log('DEBUG: Number query results:', numberQuery.map(p => ({ itemNumber: p.itemNumber, status: p.status })));
    console.log('DEBUG: Combined results:', allProducts.map(p => ({ itemNumber: p.itemNumber, status: p.status })));

    // Separate products by their current status
    // Convert all to strings for consistent comparison
    const foundItemNumbers = allProducts.map(p => String(p.itemNumber));
    const notFoundItemNumbers = cleanItemNumbers.filter(num => !foundItemNumbers.includes(String(num)));
    const alreadyAtShow = allProducts.filter(p => p.status === "At Show");
    const productsToMove = allProducts.filter(p => p.status !== "At Show");
    
    console.log('DEBUG: Found item numbers:', foundItemNumbers);
    console.log('DEBUG: Not found item numbers:', notFoundItemNumbers);
    console.log('DEBUG: Already at show:', alreadyAtShow.map(p => p.itemNumber));
    console.log('DEBUG: Products to move:', productsToMove.map(p => p.itemNumber));

    // Build detailed feedback message
    const messages = [];
    
    if (notFoundItemNumbers.length > 0) {
      messages.push(`Items not found: ${notFoundItemNumbers.join(", ")}`);
    }
    
    if (alreadyAtShow.length > 0) {
      messages.push(`Items already at show: ${alreadyAtShow.map(p => p.itemNumber).join(", ")}`);
    }

    if (productsToMove.length === 0) {
      const errorMsg = messages.length > 0 ? messages.join(". ") : "No items to move";
      return {
        success: false,
        message: errorMsg,
        data: JSON.parse(JSON.stringify(await getShowReport()))
      };
    }

    const user = await getShortUserFromToken();
    // Create history entry for each product and update status
    const historyEntry = {
      user: user,
      date: new Date(),
      action: "sent to show",
      refDoc: null
    };

    const updatePromises = productsToMove.map(product => 
      productModel.findOneAndUpdate(
        { _id: product._id },
        {
          $push: { history: historyEntry },
          $set: {
            status: "At Show",
            lastUpdated: new Date()
          }
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    // Build success message
    let successMessage = `Successfully moved ${productsToMove.length} items to "At Show"`;
    if (productsToMove.length > 0) {
      successMessage += ` (${productsToMove.map(p => p.itemNumber).join(", ")})`;
    }
    if (messages.length > 0) {
      successMessage += ". " + messages.join(". ");
    }

    // Return updated show report
    const updatedReport = await getShowReport();
    return {
      success: true,
      message: successMessage,
      data: JSON.parse(JSON.stringify(updatedReport))
    };

  } catch (error) {
    console.error('Error in bulkEntryToShow:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
      data: []
    };
  }
}

export async function bulkReleaseFromShow() {
  try {
    await dbConnect();
    
    // Find all products currently "At Show"
    const atShowProducts = await productModel.find({
      status: "At Show"
    });

    if (atShowProducts.length === 0) {
      return {
        success: true,
        message: "No items currently at show",
        data: []
      };
    }

    const user = await getShortUserFromToken();

    // Create history entry for each product and update status
    const historyEntry = {
      user: user,
      date: new Date(),
      action: "returned from show",
      refDoc: null
    };

    const updatePromises = atShowProducts.map(product => 
      productModel.findOneAndUpdate(
        { _id: product._id },
        {
          $push: { history: historyEntry },
          $set: {
            status: "In Stock",
            lastUpdated: new Date()
          }
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    // Return updated show report (should be empty now)
    const updatedReport = await getShowReport();
    return {
      success: true,
      message: `Successfully released ${atShowProducts.length} items from show back to "In Stock"`,
      data: JSON.parse(JSON.stringify(updatedReport))
    };

  } catch (error) {
    console.error('Error in bulkReleaseFromShow:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
      data: []
    };
  }
}

export async function fetchShowReportData() {
  try {
    const products = await getShowReport();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error('Error fetching show report data:', error);
    throw error;
  }
}
