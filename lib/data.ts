import dbConnect from './dbConnect';
import mongoose from 'mongoose';
import { Invoice } from "./models/invoice";
import { Tenant } from "./models/tenant";
import { productModel } from './models/product';
import { Return } from './models/return';
import { Repair } from './models/repair';
import { Out } from './models/out';
import { customerModel } from './models/customer'; import { logModel } from './models/log';
import { Counter } from './models/counter';
import { Wanted } from './models/wanted';

export async function fetchCustomers(page = 1, limit = 10, search = '') {
    try {

        await dbConnect();
        const skip = (page - 1) * limit;

        let query = {}; // Define an empty query object
        if (search) {
            query = { search: { $regex: search, $options: 'i' } };
        }

        const customers = await customerModel.find(query)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await customerModel.countDocuments(query);
        return {
            customers: JSON.parse(JSON.stringify(customers)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
}


export async function fetchProducts(page = 1, limit = 10, search = '', sortBy = 'lastUpdated', sortOrder = 'desc') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        let query: any = {
            $and: [
                { status: { $ne: 'Deleted' } }, // Exclude items with status "Deleted"
                { itemNumber: { $ne: null } }, // Exclude items with null itemNumber
                { itemNumber: { $ne: '' } }, // Exclude items with empty itemNumber
                { title: { $ne: null } } // Exclude items with null title
            ]
        };
        
        if (search) {
            query = {
                $and: [
                    { search: { $regex: search, $options: 'i' } },
                    { status: { $ne: 'Deleted' } }, // Also exclude deleted items when searching
                    { itemNumber: { $ne: null } }, // Exclude items with null itemNumber
                    { itemNumber: { $ne: '' } }, // Exclude items with empty itemNumber
                    { title: { $ne: null } } // Exclude items with null title
                ]
            };
        }

        // Build sort object
        const sortObj: any = {};
        if (sortBy === 'status' || sortBy === 'lastUpdated') {
            sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        } else {
            // Default sort
            sortObj.lastUpdated = -1;
        }

        const products = await productModel.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limit);

        const totalCount = await productModel.countDocuments(query);
        return {
            products: JSON.parse(JSON.stringify(products)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}


export async function fetchProductById(id: string) {
    try {
        await dbConnect();
        var _id = new mongoose.Types.ObjectId(id);
        const product = await productModel.findOne({ _id: _id });
        if(product){
            product.id = id;
        }
        return product;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}


export async function fetchCustomerById(id: number) {
    try {
        await dbConnect();
        const customer = await customerModel.findOne({ _id: id });
        return customer;
    } catch (error) {
        console.error('Error fetching customer:', error);
        throw error;
    }
}


export async function fetchInvoices(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query = { search: { $regex: search, $options: 'i' } };
        }

        const invoices = await Invoice.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalCount = await Invoice.countDocuments(query);

        return {
            invoices: JSON.parse(JSON.stringify(invoices)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
    }
}


export async function fetchReturns(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query = { search: { $regex: search, $options: 'i' } };
        }

        const returns = await Return.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Return.countDocuments(query);
        return {
            returns: JSON.parse(JSON.stringify(returns)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching returns:', error);
        throw error;
    }
}


export async function fetchRepairs(page = 1, limit = 10, search = '', filter = 'outstanding') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        // Calculate cutoff date (2 years ago)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        let query: any = {
            // Exclude records with dateOut more than 2 years ago
            $or: [
                { dateOut: { $exists: false } },
                { dateOut: null },
                { dateOut: { $gte: twoYearsAgo } }
            ]
        };
        
        // Apply filter
        if (filter === 'outstanding') {
            query = {
                $and: [
                    {
                        $or: [
                            { dateOut: { $exists: false } },
                            { dateOut: null },
                            { dateOut: { $gte: twoYearsAgo } }
                        ]
                    },
                    { returnDate: { $eq: null } }
                ]
            };
        }
        // If filter is 'all', we keep the base query with date filtering
        
        if (search) {
            const searchConditions = {
                $or: [
                    { repairNumber: { $regex: search, $options: 'i' } },
                    { itemNumber: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { customerFirstName: { $regex: search, $options: 'i' } },
                    { customerLastName: { $regex: search, $options: 'i' } },
                    { vendor: { $regex: search, $options: 'i' } } 
                ]
            };
            
            // Combine filter and search conditions
            if (filter === 'outstanding') {
                query = {
                    $and: [
                        {
                            $or: [
                                { dateOut: { $exists: false } },
                                { dateOut: null },
                                { dateOut: { $gte: twoYearsAgo } }
                            ]
                        },
                        { returnDate: { $eq: null } },
                        searchConditions
                    ]
                };
            } else {
                query = {
                    $and: [
                        {
                            $or: [
                                { dateOut: { $exists: false } },
                                { dateOut: null },
                                { dateOut: { $gte: twoYearsAgo } }
                            ]
                        },
                        searchConditions
                    ]
                };
            }
        }

        const repairs = await Repair.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Repair.countDocuments(query);
        return {
            repairs: JSON.parse(JSON.stringify(repairs)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching repairs:', error);
        throw error;
    }
}

export async function fetchOutstandingRepairs(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        // Build query to find repairs that don't have a return date (outstanding repairs)
        let query: any = { $and: [{ returnDate: { $eq: null } }, { dateOut: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 2)) } }] };


        if (search && search.trim() !== '') {
            query = {
                $and: [
                    { returnDate: { $eq: null } },
                    { dateOut: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 2)) } },
                    {
                        $or: [
                            { repairNumber: { $regex: search, $options: 'i' } },
                            { itemNumber: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } },
                            { customerFirstName: { $regex: search, $options: 'i' } },
                            { customerLastName: { $regex: search, $options: 'i' } }
                        ]
                    }
                ]
            };
        }

        const repairs = await Repair.find(query)
            .sort({ dateOut: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Repair.countDocuments(query);
        return {
            data: JSON.parse(JSON.stringify(repairs)),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            limit
        };
    } catch (error) {
        console.error('Error fetching outstanding repairs:', error);
        throw error;
    }
}

export async function fetchLogs(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query = { search: { $regex: search, $options: 'i' } };
        }

        const logs = await logModel.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await logModel.countDocuments(query);
        return {
            logs: JSON.parse(JSON.stringify(logs)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
}


export async function fetchOuts(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query = { search: { $regex: search, $options: 'i' } };
        }

        const outs = await Out.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Out.countDocuments();
        return {
            outs: JSON.parse(JSON.stringify(outs)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching outs:', error);
        throw error;
    }
}


export async function getRepairsForItem(productId: string) {
    try {
        await dbConnect();
        const repairs = await Repair.find({ itemId: productId });
        return repairs;
    } catch (error) {
        console.error('Error fetching outs:', error);
        throw error;
    }
}


export async function fetchLogItemById(id: string) {
    try {
        await dbConnect();
        // Get the raw collection and convert to ObjectId
        const collection = logModel.collection;
        const _id = new mongoose.Types.ObjectId(id);

        // Use raw MongoDB query that we know works
        const log = await collection.findOne({ _id });

        if (!log) {
            return null;
        }
        log.id = id;
        return log;
    } catch (error) {
        console.error('Error fetching log item:', error);
        throw error;
    }
}

export async function fetchRepairByNumber(repairNumber: string) {
    try {
        await dbConnect();
        const repair = await Repair.findOne({ repairNumber });

        return repair ? JSON.parse(JSON.stringify(repair)) : null;
    } catch (error) {
        console.error("Error fetching repair:", error);
        throw error;
    }
}

export async function fetchRepairById(id: string) {
    try {
        await dbConnect();
        const repair = await Repair.findOne({ _id: id });
        return repair ? JSON.parse(JSON.stringify(repair)) : null;
    } catch (error) {
        console.error("Error fetching repair:", error);
        throw error;
    }
}

export async function fetchDefaultTenant() {
    try {
        await dbConnect();
        const tenant = await Tenant.findOne({ isDefault: true });
        return tenant ? JSON.parse(JSON.stringify(tenant)) : null;
    } catch (error) {
        console.error("Error fetching default tenant:", error);
        throw error;
    }
}

export async function fetchTenantById(id: string) {
    try {
        await dbConnect();
        const tenant = await Tenant.findOne({ _id: id });
        return tenant ? JSON.parse(JSON.stringify(tenant)) : null;
    } catch (error) {
        console.error("Error fetching tenant:", error);
        throw error;
    }
}

export async function fetchInvoiceById(id: number) {
    try {
        await dbConnect();
        //const _id = new mongoose.Types.ObjectId(id);

        const invoice = await Invoice.findOne({ _id: id });

        return invoice ? JSON.parse(JSON.stringify(invoice)) : null;
    } catch (error) {
        console.error("Error fetching invoice:", error);
        throw error;
    }
}

export async function fetchPartnerInvoiceByProductId(id: string) {
    try {
        await dbConnect();
        let invoice = await Invoice.findOne({
            $and: [
                {
                    $or: [
                        { invoiceType: 'Consignment' },
                        { invoiceType: 'Partner' }
                    ]
                },
                { 'lineItems.productId': id }
            ]
        });

        if (invoice == null) {

            invoice = new Invoice();

            const product = await productModel.findById(id);

            if (!product) {
                console.log("error getting partner product");
                return null;
            }

            const amount = product.cost / 2.0;

            invoice.invoiceType = product.sellerType;
            invoice.customerFirstName = product.seller;
            invoice.customerLastName = "";
            invoice.total = amount;
            invoice.subtotal = amount;
            invoice.date = new Date();
            invoice.lineItems.push(
                {
                    name: product.title,
                    longDesc: product.longDesc,
                    serialNumber: product.serialNo,
                    modelNumber: product.modelNumber,
                    amount: amount,
                    productId: product._id,
                    itemNumber: product.itemNumber
                }
            );


            const newInvoiceNumber = await Counter.findByIdAndUpdate(
                { _id: 'invoiceNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            invoice._id = newInvoiceNumber.seq;
            invoice.search = `${invoice.customerFirstName} ${invoice.customerLastName} ${invoice.invoiceNo || ''}`;
            invoice.date = new Date();

            await invoice.save();

        }

        return invoice ? JSON.parse(JSON.stringify(invoice)) : null;
    }


    catch (error) {
        console.error("Error fetching partner invoice:", error);
        throw error;
    }
}


export async function fetchOutById(id: string) {
    try {
        await dbConnect();
        const _id = new mongoose.Types.ObjectId(id);
        const out = await Out.findOne({ _id });
        return out ? JSON.parse(JSON.stringify(out)) : null;
    } catch (error) {
        console.error("Error fetching out item:", error);
        throw error;
    }
}

export async function fetchReturnById(id: number) {
    try {
        await dbConnect();
        const returnItem = await Return.findOne({ _id: id });
        return returnItem ? JSON.parse(JSON.stringify(returnItem)) : null;
    } catch (error) {
        console.error("Error fetching return item:", error);
        throw error;
    }
}

export async function fetchReturnByInvoiceId(invoiceId: string) {
    try {
        await dbConnect();
        const returnItem = await Return.findOne({ invoiceId });
        return returnItem ? JSON.parse(JSON.stringify(returnItem)) : null;
    } catch (error) {
        console.error("Error fetching return by invoice ID:", error);
        throw error;
    }
}

export async function fetchWanted(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;

        let query: any = {};
        
        if (search) {
            const searchConditions = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { customerName: { $regex: search, $options: 'i' } }
                ]
            };
            query = searchConditions;
        }

        const wanted = await Wanted.find(query)
            .sort({ createdDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Wanted.countDocuments(query);
        return {
            wanted: JSON.parse(JSON.stringify(wanted)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching wanted items:', error);
        throw error;
    }
}

export async function fetchWantedById(id: string) {
    try {
        await dbConnect();
        const wanted = await Wanted.findById(id);
        return JSON.parse(JSON.stringify(wanted));
    } catch (error) {
        console.error('Error fetching wanted item:', error);
        throw error;
    }
}
