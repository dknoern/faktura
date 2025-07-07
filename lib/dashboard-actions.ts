'use server'

import dbConnect from './dbConnect';
import { productModel } from './models/product';
import { Repair } from './models/repair';
import { Invoice } from './models/invoice';
import { logModel } from './models/log';
import { fetchOuts } from './data';

export interface DashboardStats {
  totalInventory: number;
  totalRepairsOut: number;
  totalItemsAtShow: number;
}

export interface MonthlySalesData {
  month: string;
  sales: number;
}

export interface RecentTransaction {
  id: string;
  type: 'sale' | 'log_in' | 'log_out';
  description: string;
  amount?: number;
  date: Date;
  customer?: string;
  itemNumber?: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    await dbConnect();
    
    // Total items in inventory (In Stock status)
    const totalInventory = await productModel.countDocuments({ 
      status: 'In Stock' 
    });
    
    // Calculate cutoff date (2 years ago)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    // Total repairs out (repairs without return date and within last 2 years)
    const totalRepairsOut = await Repair.countDocuments({ 
      $and: [
        { returnDate: { $eq: null } },
        {
          $or: [
            { dateOut: { $exists: false } },
            { dateOut: null },
            { dateOut: { $gte: twoYearsAgo } }
          ]
        }
      ]
    });
    
    // Total items out at show (At Show status)
    const totalItemsAtShow = await productModel.countDocuments({ 
      status: 'At Show' 
    });
    
    return {
      totalInventory,
      totalRepairsOut,
      totalItemsAtShow
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return mock data as fallback
    return {
      totalInventory: 0,
      totalRepairsOut: 0,
      totalItemsAtShow: 0
    };
  }
}

export async function getMonthlySalesData(): Promise<MonthlySalesData[]> {
  try {
    await dbConnect();
    
    // Get the last 24 months (2 years)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 23);
    
    // Aggregate sales by month from invoices
    const salesData = await Invoice.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalSales: { $sum: '$total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Create array for all 24 months with proper formatting
    const months = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 24; i++) {
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Find matching sales data
      const salesRecord = salesData.find(
        record => record._id.year === year && record._id.month === month
      );

      // round sales to nearest dollar
      const roundedSales = salesRecord ? Math.round(salesRecord.totalSales) : 0;
      
      months.push({
        month: `${monthName} ${year.toString().slice(-2)}`,
        sales: roundedSales
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // drop the first month
    months.shift();
    
    return months;
  } catch (error) {
    console.error('Error fetching monthly sales data:', error);
    // Return mock data as fallback (24 months)
    return [];
  }
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  try {
    await dbConnect();
    
    const transactions: RecentTransaction[] = [];
    
    // Get recent sales (invoices)
    const recentInvoices = await Invoice.find({})
      .sort({ date: -1 })
      .limit(5)
      .lean();
    
    for (const invoice of recentInvoices) {
      transactions.push({
        id: String(invoice._id),
        type: 'sale',
        description: `Sold to ${invoice.customerFirstName} ${invoice.customerLastName}`,
        amount: invoice.total,
        date: invoice.date,
        customer: `${invoice.customerFirstName} ${invoice.customerLastName}`
      });
    }
    
    // Get recent log entries (log ins/outs)
    const recentLogs = await logModel.find({})
      .sort({ date: -1 })
      .limit(5)
      .lean();
    
    for (const log of recentLogs) {


      let description = "Received";
      if (log.customerName) description += " from " + log.customerName;

      if (log.receivedFrom) description += " via " + log.receivedFrom;

      //const product = await productModel.findById(log.productId).lean();
      transactions.push({
        id: String(log._id),
        type: 'log_in',
        description: description,
        date: log.date,
      });
    }


    const recentOuts = await fetchOuts(1,10,'');

    for (const out of recentOuts.outs) {
      transactions.push({
        id: String(out._id),
        type: 'log_out',
        description: `Sent to ${out.sentTo}`,
        date: out.date,
        customer: `${out.customerFirstName} ${out.customerLastName}`
      });
    }
    
    // Sort all transactions by date and take the most recent 10
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return transactions.slice(0, 10);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    // Return mock data as fallback
    return [];
  }
}
