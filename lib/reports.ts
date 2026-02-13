import dbConnect from "./dbConnect";

import { customerModel } from "./models/customer";
import { productModel } from "./models/product";
import { Repair } from "./models/repair";
import { Return } from "./models/return";
import { Invoice } from "./models/invoice";

export async function getBySellerType(sellerType: string) {
    try {

        await dbConnect();
        const products = await productModel.find({ "sellerType": sellerType }).sort({
            lastUpdated: -1
        }).select({
            seller: 1,
            lastUpdated: 1,
            _id: 1,
            itemNumber: 1,
            title: 1,
            cost: 1,
            sellingPrice: 1
        });

        return products;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getVendorsWithOutstandingRepairs() {
    try {
        await dbConnect();

        const repairs = await Repair.find({
            'returnDate': null
        }).sort({
            vendor: 1
        }).select({
            vendor: 1
        });

        const vendorList: string[] = repairs.map((repair: { vendor: string }) => repair.vendor);
        vendorList.unshift("All");
        return vendorList;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getOutstandingRepairs(vendor: string) {
    try {

        vendor = vendor.toLowerCase();
        if (vendor == "all") vendor = "";

        await dbConnect();

        const repairs = await Repair.find({
            'returnDate': null,
            'search': new RegExp(vendor, 'i')

        }).sort({
            dateOut: -1
        }).select({
            itemNumber: 1,
            repairNumber: 1,
            vendor: 1,
            description: 1,
            dateOut: 1
        });

        return repairs


    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getItemsOnMemo() {

    try {

        await dbConnect();

        const products = await productModel.find({
            'status': 'Memo'
        }).sort({
            lastUpdated: -1
        }).select({
            itemNumber: 1,
            title: 1,
            seller: 1,
            lastUpdated: 1
        });

        return products

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getDailySales(year: number, month: number, day: number) {

    try {
        await dbConnect();

        // Create start and end dates for the day in local timezone
        const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

        const invoices = await Invoice.find({
            "date": {
                $gte: startDate,
                $lte: endDate
            },
            "invoiceType": { $nin: ["Partner", "Consignment"] }
        }).sort({
            date: -1
        }).select({
            date: 1,
            lineItems: 1,
            salesPerson: 1,
            methodOfSale: 1,
            invoiceType: 1
        });
        return invoices;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getLogItems(year: number, month: number, day: number) {

    try {
        await dbConnect();

        const products = await productModel.find({
            "received": {
                $gte: new Date(year, month - 1, day),
                $lt: new Date(year, month - 1, day + 1)
            }
        }).sort({
            date: -1
        }).select({
            _id: 1,
            received: 1,
            comments: 1,
            title: 1,
            receivedBy: 1,
            receivedFrom: 1
        });

        return products;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getReturnsSummary(year: number, month: number) {

    try {
        await dbConnect();

        const returns = await Return.find({
            "returnDate": {
                $gte: new Date(year, month - 1, 1),
                $lte: new Date(year, month, 1)
            }
        }).sort({
            returnDate: -1
        }).select({
            lineItems: 1,
            returnDate: 1,
            customerName: 1
        });

        return returns

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getProductsForSellerType(sellerType: string) {

    try {
        await dbConnect();

        const products = await productModel.find({
            "sellerType": sellerType
        }).sort({
            lastUpdated: -1
        }).select({
            seller: 1,
            lastUpdated: 1,
            _id: 1,
            itemNumber: 1,
            title: 1,
            cost: 1,
            sellingPrice: 1
        });

        return products

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getMonthlySales(year: number, month: number) {

    try {
        await dbConnect();

        const invoices = await Invoice.find({
            //"invoiceType": "Invoice",
            "date": {
                $gte: new Date(year, month - 1, 1),
                $lte: new Date(year, month, 1)
            }

        }).sort({
            date: -1
        }).select({
            customerFirstName: 1,
            customerLastName: 1,
            date: 1,
            customerEmail: 1,
            _id: 1,
            total: 1,
            lineItems: 1,
            salesPerson: 1,
            shipState: 1
        });

        return invoices;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getOutAtShow() {

    try {
        await dbConnect();

        const products = await productModel.find({
            'status': 'At Show'
        }).sort({
            lastUpdated: -1
        }).select({
            _id: 1,
            title: 1,
            lastUpdated: 1,
            itemNumber: 1
        });

        return products;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getInStock() {

    try {
        await dbConnect();

        const products = await productModel.find({
            $and: [{
                status: { $in: ["In Stock", "Partnership", "Consignment"] }
            },
            { itemNumber: { $ne: null } }
            ]
        }).sort({
            lastUpdated: -1
        }).select({
            _id: 1,
            title: 1,
            lastUpdated: 1,
            itemNumber: 1,
            seller: 1,
            status: 1,
            productType: 1
        });

        return products;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}

export async function getAllStock() {

    try {
        await dbConnect();

        const products = await productModel.find({
            $and: [{
                status: { $in: ["In Stock", "Memo", "Repair"] }
            },
            { itemNumber: { $ne: null } }
            ]
        }).sort({
            lastUpdated: -1
        }).select({
            _id: 1,
            title: 1,
            lastUpdated: 1,
            itemNumber: 1,
            seller: 1,
            status: 1,
            productType: 1
        });

        return products;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}

export async function getShowReport() {

    try {
        await dbConnect();
        const products = await productModel.find({
            'status': 'At Show'
        }).sort({
            lastUpdated: -1
        }).select({
            _id: 1,
            title: 1,
            lastUpdated: 1,
            itemNumber: 1,
            cost: 1,
            listPrice: 1,
            sellingPrice: 1,
            serialNo: 1
        });

        return products;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}



export async function getFirstSaleDate() {

    try {
        await dbConnect();
        const invoice = await Invoice.findOne({}).sort({
            date: 1
        }).select({
            date: 1
        });

        //var dateString = format('yyyy/MM/dd', invoice.date);

        return invoice.date;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}

export async function getLastSaleDate() {

    try {
        await dbConnect();
        const invoice = await Invoice.findOne({}).sort({
            date: -1
        }).select({
            date: 1
        });

        //var dateString = format('yyyy/MM/dd', invoice.date);

        return invoice.date;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}


export async function getCustomers() {

    try {
        await dbConnect();

        const customers = await customerModel.find({
        }).sort({
            _id: -1
        }).select({
            firstName: 1,
            lastName: 1,
            city: 1,
            state: 1,
            email: 1,
            phone: 1,
            company: 1
        });

        return customers;

    } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
    }
}
