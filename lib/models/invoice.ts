//
//var formatCurrency = require('format-currency');


import mongoose from "mongoose";

//var Counter = require('./counter');
//var opts = { format: '%s%v', symbol: '$' };

var LineItemSchema = new mongoose.Schema({
    productId: String,
    itemNumber: String,
    name: String,
    amount: Number,
    serialNumber: String,
    longDesc: String
});

/*
LineItemSchema.virtual('amountFMT').get(function (this: { amount: number }) {
    return formatCurrency(this.amount, opts);
});
*/
var InvoiceSchema = new mongoose.Schema({
    invoiceNumber: Number,
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    customerId: Number,
    customerFirstName: String,
    customerLastName: String,
    customerEmail: String,
    customerPhone: String,
    project: String,
    returnNumber: String,
    documentType: String,
    date: Date,
    shipVia: String,
    paidBy: String,
    authNumber: String,
    subtotal: Number,
    tax: Number,
    shipping: Number,
    total: Number,
    methodOfSale: String,
    salesPerson: String,
    invoiceType: String,
    shipToName: String,
    shipAddress1: String,
    shipAddress2: String,
    shipAddress3: String,
    shipCity: String,
    shipState: String,
    shipZip: String,
    shipCountry: String,
    billingAddress1: String,
    billingAddress2: String,
    billingAddress3: String,
    billingCity: String,
    billingState: String,
    billingZip: String,
    billingCountry: String,
    copyAddress: Boolean,
    search: String,
    taxExempt: Boolean,
    lineItems: {
        type: [LineItemSchema]
    },
    status: String,
    trackingNumber: String
});

// TODO: remove pre hook
/*
InvoiceSchema.pre('save', function (this: any, next) {
    var doc = this;

    doc.search = doc.customerFirstName + " " + doc.customerLastName + " " + format('yyyy-MM-dd', doc.date) + " ";

    if (doc.lineItems != null) {
        for (var i = 0; i < doc.lineItems.length; i++) {
            if(doc.lineItems[i] != null){
                doc.search += " " + doc.lineItems[i].itemNumber + " " + doc.lineItems[i].name;
            }
        }
    }

    if (doc._id==null) {
        Counter.findByIdAndUpdate({_id: 'invoiceNumber'}, {$inc: {seq: 1}}, function (error, counter) {
            if (error)
                return next(error);
            doc._id = counter.seq;

            doc.search = doc._id + " " + doc.search;
            next();
        });
    }else{

        doc.search = doc._id + " " + doc.search;
        next();
    }
});
*/

/*
InvoiceSchema.virtual('dateFMT').get(function (this: { date: Date }) {

    var hours = this.date.getHours();
    var minutes = this.date.getMinutes();
    let minutesString = minutes.toString();
    if(minutes<10) minutesString = "0" + minutes.toString();
    var ampm = " a.m."

    if(hours>11){
        ampm = " p.m."
    }   
    
    if(hours>12){
        hours = hours - 12;
    }
 

    var formatedDate = format('MM/dd/yyyy', this.date) + " " + hours + ":" + minutesString + ampm;
    return formatedDate;
});
*/
InvoiceSchema.virtual('invoiceTypeFMT').get(function (this: { invoiceType: string }) {
    var invoiceType = this.invoiceType;
    if (invoiceType == null) invoiceType = "Invoice";
    if (invoiceType == 'Consignment') invoiceType = "Consignment Agreement";
    else if (invoiceType == 'Partner') invoiceType = "Partner Invoice";
    return invoiceType.toUpperCase();
});

/*
InvoiceSchema.virtual('subtotalFMT').get(function (this: { subtotal: number }) {
    return formatCurrency(this.subtotal, opts);
});

InvoiceSchema.virtual('taxFMT').get(function (this: { tax: number }) {
    return formatCurrency(this.tax, opts);
});

InvoiceSchema.virtual('shippingFMT').get(function (this: { shipping: number }) {
    return formatCurrency(this.shipping, opts);
});

InvoiceSchema.virtual('totalFMT').get(function (this: { total: number }) {
    return formatCurrency(this.total, opts);
});
*/
InvoiceSchema.virtual('shipCityFMT').get(function (this: { shipCity: string; shipState: string; shipZip: string }) {
    return formatCity(this.shipCity, this.shipState, this.shipZip);
});

InvoiceSchema.virtual('billingCityFMT').get(function (this: { billingCity: string; billingState: string; billingZip: string }) {
    return formatCity(this.billingCity, this.billingState, this.billingZip);
});

function formatCity(city: string, state: string, zip: string) {
    var cityFMT = "";
    if (city) {
        cityFMT += city;
    }

    if (city && state) {
        cityFMT += ", ";
    }

    if (state) {
        cityFMT += state
    }

    if (state && zip) {
        cityFMT += " ";
    }

    if (zip) {
        cityFMT += zip;
    }

    return cityFMT;
}


InvoiceSchema.virtual('isConsignment').get(function (this: { invoiceType: string }) {
    return "Consignment" == this.invoiceType;
});

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
