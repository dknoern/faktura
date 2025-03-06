import mongoose from "mongoose";

var ProductSchema = new mongoose.Schema({
    itemNumber: String,
    productType: String,
    manufacturer: String,
    title: String,
    paymentMethod: String,
    paymentDetails: String,
    modelNumber: String,
    model: String,
    condition: String,
    gender: String,
    features: String,
    case: String,
    size: String,
    dial: String,
    bracelet: String,
    comments: String,
    serialNo: String,
    longDesc: String,
    lastUpdated: Date,
    cost: Number,
    listPrice: Number,
    totalRepairCost: Number,
    sellingPrice: Number,
    received: Date,
    status: String,
    notes: String,
    ebayNoReserve: Boolean,
    inventoryItem: Boolean,
    sellerType: String,
    seller: String,
    search: String,
    history: [{
        user: String,
        date: Date,
        action: String,
        itemReceived: String,
        receivedFrom: String,
        customerName: String,
        comments: String,
        search: String,
        repairNumber: String,
        repairCost: Number,
        refDoc: String
    }]
});


ProductSchema.virtual('statusDisplay').get(function (this: mongoose.Document & { sellerType: string; status: string }) {

    if('Partner' == this.sellerType && 'In Stock' == this.status){
        return "Partnership";
    }else if('Consignment' == this.sellerType && 'In Stock' == this.status){
        return "Consignment";
    }else{
        return this.status;
    }
});

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
