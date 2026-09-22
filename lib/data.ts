import dbConnect from './dbConnect';
import mongoose from 'mongoose';
import { Invoice } from "./models/invoice";
import { Proposal } from "./models/proposal";
import { Tenant } from "./models/tenant";
import { productModel } from './models/product';
import { Return } from './models/return';
import { Repair } from './models/repair';
import { Out } from './models/out';
import { customerModel } from './models/customer'; import { logModel } from './models/log';
import { vendorModel } from './models/vendor';
import { timeEntryModel } from './models/time';
import { vendorPaymentModel } from './models/vendor-payment';
import { Wanted } from './models/wanted';
import { addTenantFilter, getTenantObjectId, getNextCounter } from './tenant-utils';
import { getTenantId } from './auth-utils';
import { hostMatchesDomain } from './public-tenant';

export async function fetchCustomers(page = 1, limit = 10, search = '', { includeDeleted = false }: { includeDeleted?: boolean } = {}) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = {}; // Define an empty query object
        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);

            // Create a regex condition for each token
            const searchConditions = searchTokens.map(token => (
                { search: { $regex: token, $options: 'i' } }
            ));

            // Use $and to ensure ALL tokens must be found (in any order)
            query = { $and: searchConditions };
        }

        query = addTenantFilter(query, tenantObjectId);
        if (!includeDeleted) {
            query.status = { $ne: 'Deleted' };
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


export async function fetchVendors(page = 1, limit = 10, search = '', { includeDeleted = false }: { includeDeleted?: boolean } = {}) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = {};
        if (search) {
            const searchTokens = search.trim().split(/\s+/);
            const searchConditions = searchTokens.map(token => (
                { search: { $regex: token, $options: 'i' } }
            ));
            query = { $and: searchConditions };
        }

        query = addTenantFilter(query, tenantObjectId);
        if (!includeDeleted) {
            query.status = { $ne: 'Deleted' };
        }

        const vendors = await vendorModel.find(query)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await vendorModel.countDocuments(query);
        return {
            vendors: JSON.parse(JSON.stringify(vendors)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching vendors:', error);
        throw error;
    }
}


export async function fetchVendorById(id: string, { includeDeleted = false }: { includeDeleted?: boolean } = {}) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const query: any = { _id: id, tenantId: tenantObjectId };
        if (!includeDeleted) {
            query.status = { $ne: 'Deleted' };
        }
        const vendor = await vendorModel.findOne(query);
        return vendor;
    } catch (error) {
        console.error('Error fetching vendor:', error);
        throw error;
    }
}


export async function fetchVendorByEmail(email: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const vendor = await vendorModel.findOne({
            tenantId: tenantObjectId,
            email,
            status: { $ne: 'Deleted' },
        });
        return vendor;
    } catch (error) {
        console.error('Error fetching vendor by email:', error);
        throw error;
    }
}


export async function fetchTimeEntries(
    page = 1,
    limit = 20,
    { status = '', vendorId = '' }: { status?: string; vendorId?: string } = {}
) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        const query: any = { tenantId: tenantObjectId };
        if (status) {
            query.status = status;
        }
        if (vendorId) {
            query.vendorId = vendorId;
        }

        const entries = await timeEntryModel.find(query)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await timeEntryModel.countDocuments(query);
        return {
            entries: JSON.parse(JSON.stringify(entries)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching time entries:', error);
        throw error;
    }
}


// Approved entries not yet included in a payout, used to build the payout summary
export async function fetchUnpaidApprovedEntries(vendorId: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const entries = await timeEntryModel.find({
            tenantId: tenantObjectId,
            vendorId,
            status: 'Approved',
        }).sort({ date: 1 });
        return JSON.parse(JSON.stringify(entries));
    } catch (error) {
        console.error('Error fetching unpaid approved entries:', error);
        throw error;
    }
}


export async function fetchVendorPayments(page = 1, limit = 20, { vendorId = '' }: { vendorId?: string } = {}) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        const query: any = { tenantId: tenantObjectId };
        if (vendorId) {
            query.vendorId = vendorId;
        }

        const payments = await vendorPaymentModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await vendorPaymentModel.countDocuments(query);
        return {
            payments: JSON.parse(JSON.stringify(payments)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching vendor payments:', error);
        throw error;
    }
}


export async function fetchVendorPaymentById(id: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const payment = await vendorPaymentModel.findOne({ _id: id, tenantId: tenantObjectId });
        return payment ? JSON.parse(JSON.stringify(payment)) : null;
    } catch (error) {
        console.error('Error fetching vendor payment:', error);
        throw error;
    }
}


// All time/expense entries included in a given payout
export async function fetchEntriesByPaymentId(paymentId: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const entries = await timeEntryModel.find({
            tenantId: tenantObjectId,
            paymentId,
        }).sort({ date: 1 });
        return JSON.parse(JSON.stringify(entries));
    } catch (error) {
        console.error('Error fetching entries for payment:', error);
        throw error;
    }
}


// Projects selectable for time entry — proposals, labelled by their project
// name when set, otherwise by customer. Closed and Cancelled proposals no
// longer accept time or expenses.
export async function fetchProjectOptions(): Promise<{ id: string; label: string }[]> {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const proposals = await Proposal.find({
            tenantId: tenantObjectId,
            status: { $nin: ['Closed', 'Cancelled'] },
        })
            .select({ project: 1, customerFirstName: 1, customerLastName: 1, date: 1 })
            .sort({ date: -1 })
            .limit(200);

        return proposals.map((p: any) => ({
            id: p._id.toString(),
            label: p.project?.trim() ||
                `${p.customerFirstName ?? ''} ${p.customerLastName ?? ''}`.trim() ||
                'Proposal',
        }));
    } catch (error) {
        console.error('Error fetching project options:', error);
        throw error;
    }
}


export async function fetchVendorOptions(): Promise<{ id: string; label: string }[]> {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const vendors = await vendorModel.find({ tenantId: tenantObjectId, status: { $ne: 'Deleted' } })
            .select({ firstName: 1, lastName: 1, company: 1 })
            .sort({ lastName: 1, firstName: 1 });

        return vendors.map((v: any) => ({
            id: v._id.toString(),
            label: `${v.firstName} ${v.lastName}`.trim() + (v.company ? ` (${v.company})` : ''),
        }));
    } catch (error) {
        console.error('Error fetching vendor options:', error);
        throw error;
    }
}


export async function fetchProducts(page = 1, limit = 10, search = '', sortBy = 'lastUpdated', sortOrder = 'desc') {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        // Base query conditions that apply to all queries
        const baseConditions = [
            { status: { $ne: 'Deleted' } }, // Exclude items with status "Deleted"
            { itemNumber: { $ne: null } }, // Exclude items with null itemNumber
            { itemNumber: { $ne: '' } }, // Exclude items with empty itemNumber
            { title: { $ne: null } }, // Exclude items with null title
            { tenantId: tenantObjectId }
        ];
        
        let query: any = {
            $and: baseConditions
        };
        
        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);
            
            // Create a regex condition for each token
            const searchConditions = searchTokens.map(token => (
                { search: { $regex: token, $options: 'i' } }
            ));
            
            // Use $and to ensure ALL tokens must be found (in any order)
            query = {
                $and: [
                    { $and: searchConditions },
                    ...baseConditions
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
        const tenantObjectId = await getTenantObjectId();
        var _id = new mongoose.Types.ObjectId(id);
        const product = await productModel.findOne({ _id: _id, tenantId: tenantObjectId });
        if(product){
            product.id = id;
        }
        return product;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}


export async function fetchCustomerById(id: string, { includeDeleted = false }: { includeDeleted?: boolean } = {}) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const query: any = { _id: id, tenantId: tenantObjectId };
        if (!includeDeleted) {
            query.status = { $ne: 'Deleted' };
        }
        const customer = await customerModel.findOne(query);
        return customer;
    } catch (error) {
        console.error('Error fetching customer:', error);
        throw error;
    }
}


export async function fetchInvoices(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = { status: { $ne: 'Deleted' } };
        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);

            // Create a regex condition for each token
            const searchConditions = searchTokens.map(token => (
                { search: { $regex: token, $options: 'i' } }
            ));

            // Use $and to ensure ALL tokens must be found (in any order)
            query = { $and: [...searchConditions, { status: { $ne: 'Deleted' } }] };
        }

        query = addTenantFilter(query, tenantObjectId);

        const invoices = await Invoice.find(query)
            .sort({ date: -1 })
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

export async function fetchProposals(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = {};
        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);
            
            // Create a regex condition for each token
            const searchConditions = searchTokens.map(token => (
                { search: { $regex: token, $options: 'i' } }
            ));
            
            // Use $and to ensure ALL tokens must be found (in any order)
            query = { $and: searchConditions };
        }

        query = addTenantFilter(query, tenantObjectId);

        const proposals = await Proposal.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalCount = await Proposal.countDocuments(query);

        return {
            proposals: JSON.parse(JSON.stringify(proposals)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching proposals:', error);
        throw error;
    }
}

export async function fetchProposalById(id: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const proposal = await Proposal.findOne({ _id: id, tenantId: tenantObjectId });
        return JSON.parse(JSON.stringify(proposal));
    } catch (error) {
        console.error('Error fetching proposal:', error);
        throw error;
    }
}

export async function fetchReturns(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = { status: { $ne: 'Deleted' } };
        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);

            // Create a regex condition for each token
            const searchConditions = searchTokens.map(token => (
                { search: { $regex: token, $options: 'i' } }
            ));

            // Use $and to ensure ALL tokens must be found (in any order)
            query = { $and: [...searchConditions, { status: { $ne: 'Deleted' } }] };
        }

        query = addTenantFilter(query, tenantObjectId);

        const returns = await Return.find(query)
            .sort({ returnDate: -1 })
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
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        // Calculate cutoff date (2 years ago)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        // Build base conditions
        const conditions: any[] = [
            // Exclude records with dateOut more than 2 years ago
            {
                $or: [
                    { dateOut: { $exists: false } },
                    { dateOut: null },
                    { dateOut: { $gte: twoYearsAgo } }
                ]
            },
            // Exclude deleted repairs
            {
                $or: [
                    { status: { $exists: false } },
                    { status: { $ne: 'Deleted' } }
                ]
            }
        ];

        // Apply outstanding filter
        if (filter === 'outstanding') {
            conditions.push({ returnDate: { $eq: null } });
        }

        // If search parameter is provided, add search condition
        if (search && search.trim() !== '') {
            const searchTokens = search.trim().split(/\s+/);

            const tokenConditions = searchTokens.map(token => ({
                $or: [
                    { repairNumber: { $regex: token, $options: 'i' } },
                    { itemNumber: { $regex: token, $options: 'i' } },
                    { description: { $regex: token, $options: 'i' } },
                    { customerFirstName: { $regex: token, $options: 'i' } },
                    { customerLastName: { $regex: token, $options: 'i' } },
                    { vendor: { $regex: token, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $dateToString: { format: '%m/%d/%Y', date: '$dateOut' } }, regex: token, options: 'i' } } },
                    { $expr: { $regexMatch: { input: { $dateToString: { format: '%m/%d/%Y', date: '$returnDate' } }, regex: token, options: 'i' } } },
                    { $expr: { $regexMatch: { input: { $toString: '$repairCost' }, regex: token, options: 'i' } } }
                ]
            }));

            conditions.push({ $and: tokenConditions });
        }

        let query: any = { $and: conditions };
        query = addTenantFilter(query, tenantObjectId);

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

export async function fetchLogs(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = {
            // Exclude deleted logs
            $or: [
                { status: { $exists: false } },
                { status: { $ne: 'Deleted' } }
            ]
        };
        
        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);
            
            // Create a regex condition for each token
            const searchConditions = searchTokens.map(token => (
                { search: { $regex: token, $options: 'i' } }
            ));
            
            // Combine status filter with search conditions
            query = {
                $and: [
                    // Exclude deleted logs
                    {
                        $or: [
                            { status: { $exists: false } },
                            { status: { $ne: 'Deleted' } }
                        ]
                    },
                    // Search conditions
                    { $and: searchConditions }
                ]
            };
        }

        query = addTenantFilter(query, tenantObjectId);

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
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = {
            // Exclude deleted outs
            $or: [
                { status: { $exists: false } },
                { status: { $ne: 'Deleted' } }
            ]
        };
        
        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);

            // Each token must match at least one of the displayed fields
            // (date, sent to, description, by, comments)
            const searchConditions = searchTokens.map(token => {
                const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return {
                    $or: [
                        { sentTo: { $regex: escaped, $options: 'i' } },
                        { description: { $regex: escaped, $options: 'i' } },
                        { user: { $regex: escaped, $options: 'i' } },
                        { comments: { $regex: escaped, $options: 'i' } },
                        {
                            // Match against the date as displayed in the table (MM/DD/YYYY)
                            $expr: {
                                $regexMatch: {
                                    input: {
                                        $dateToString: {
                                            format: '%m/%d/%Y',
                                            date: '$date',
                                            onNull: ''
                                        }
                                    },
                                    regex: escaped,
                                    options: 'i'
                                }
                            }
                        }
                    ]
                };
            });

            // Combine status filter with search conditions
            query = {
                $and: [
                    // Exclude deleted outs
                    {
                        $or: [
                            { status: { $exists: false } },
                            { status: { $ne: 'Deleted' } }
                        ]
                    },
                    // Search conditions
                    { $and: searchConditions }
                ]
            };
        }

        query = addTenantFilter(query, tenantObjectId);

        const outs = await Out.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Out.countDocuments(query);
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
        const tenantObjectId = await getTenantObjectId();
        const repairs = await Repair.find({ itemId: productId, tenantId: tenantObjectId });
        return repairs;
    } catch (error) {
        console.error('Error fetching outs:', error);
        throw error;
    }
}


export async function fetchLogItemById(id: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        // Get the raw collection and convert to ObjectId
        const collection = logModel.collection;
        const _id = new mongoose.Types.ObjectId(id);

        // Use raw MongoDB query that we know works
        const log = await collection.findOne({ _id, tenantId: tenantObjectId });

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
        const tenantObjectId = await getTenantObjectId();
        const repair = await Repair.findOne({ repairNumber, tenantId: tenantObjectId });

        return repair ? JSON.parse(JSON.stringify(repair)) : null;
    } catch (error) {
        console.error("Error fetching repair:", error);
        throw error;
    }
}

export async function fetchRepairById(id: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const repair = await Repair.findOne({ _id: id, tenantId: tenantObjectId });
        return repair ? JSON.parse(JSON.stringify(repair)) : null;
    } catch (error) {
        console.error("Error fetching repair:", error);
        throw error;
    }
}

export async function fetchTenant() {
    const tenantId = await getTenantId();
    return await fetchTenantById(tenantId);
}


// Finds the tenant whose custom domain matches the request host (apex, www,
// or any subdomain). Returns null when no tenant claims the domain — the
// caller should then show the generic landing page with self-signup.
// Never throws: the public landing page must render even if the DB is down.
export async function fetchTenantByHost(host: string | null | undefined) {
    if (!host) return null;
    try {
        await dbConnect();
        const tenants = await Tenant.find({ customDomain: { $exists: true, $nin: [null, ''] } })
            .select({ name: 1, nameLong: 1, customDomain: 1, splashImage: 1, logo: 1 })
            .lean();
        const match = (tenants as any[]).find((t) => hostMatchesDomain(host, t.customDomain));
        return match ? JSON.parse(JSON.stringify(match)) : null;
    } catch (error) {
        console.error('Error fetching tenant by host:', error);
        return null;
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

export async function fetchInvoiceById(id: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();

        const invoice = await Invoice.findOne({ _id: id, tenantId: tenantObjectId });

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


            const newInvoiceNumber = await getNextCounter('invoiceNumber');

            invoice.invoiceNumber = newInvoiceNumber;
            invoice.tenantId = await getTenantObjectId();
            invoice.search = `${newInvoiceNumber} ${invoice.customerFirstName} ${invoice.customerLastName}`;
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
        const tenantObjectId = await getTenantObjectId();
        const _id = new mongoose.Types.ObjectId(id);
        const out = await Out.findOne({ _id, tenantId: tenantObjectId });
        return out ? JSON.parse(JSON.stringify(out)) : null;
    } catch (error) {
        console.error("Error fetching out item:", error);
        throw error;
    }
}

export async function fetchReturnById(id: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const returnItem = await Return.findOne({ _id: id, tenantId: tenantObjectId });
        return returnItem ? JSON.parse(JSON.stringify(returnItem)) : null;
    } catch (error) {
        console.error("Error fetching return item:", error);
        throw error;
    }
}

export async function fetchReturnByInvoiceId(invoiceId: string) {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const returnItem = await Return.findOne({ invoiceId: new mongoose.Types.ObjectId(invoiceId), tenantId: tenantObjectId });
        return returnItem ? JSON.parse(JSON.stringify(returnItem)) : null;
    } catch (error) {
        console.error("Error fetching return by invoice ID:", error);
        throw error;
    }
}

export async function fetchWanted(page = 1, limit = 10, search = '') {
    try {
        await dbConnect();
        const tenantObjectId = await getTenantObjectId();
        const skip = (page - 1) * limit;

        let query: any = { status: { $ne: 'Deleted' } };

        if (search) {
            // Split search into tokens (words)
            const searchTokens = search.trim().split(/\s+/);
            
            // For each token, create a condition that checks all searchable fields
            const tokenConditions = searchTokens.map(token => ({
                $or: [
                    { title: { $regex: token, $options: 'i' } },
                    { description: { $regex: token, $options: 'i' } },
                    { customerName: { $regex: token, $options: 'i' } }
                ]
            }));
            
            // Use $and to ensure ALL tokens must be found (in any order), preserving deleted filter
            query = { $and: [...tokenConditions, { status: { $ne: 'Deleted' } }] };
        }

        query = addTenantFilter(query, tenantObjectId);

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
        const tenantObjectId = await getTenantObjectId();
        const wanted = await Wanted.findOne({ _id: id, tenantId: tenantObjectId });
        return JSON.parse(JSON.stringify(wanted));
    } catch (error) {
        console.error('Error fetching wanted item:', error);
        throw error;
    }
}
