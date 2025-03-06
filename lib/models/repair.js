//var format = require('date-format');
//var formatCurrency = require('format-currency');
var opts = { format: '%s%v', symbol: '$' };

import mongoose from "mongoose";

var RepairSchema = new mongoose.Schema({
    repairNumber: String,
    dateOut: Date,
    expectedReturnDate: Date,
    returnDate: Date,
    itemId: String,
    itemNumber: String,
    description: String,
    repairIssues: String,
    vendor: String,
    customerId: Number,
    customerFirstName: String,
    customerLastName: String,
    email: String,
    phone: String,
    repairNotes: String,
    hasPapers: Boolean,
    search: String,
    repairCost: Number,
    warrantyService: Boolean,
    customerApprovedDate: Date
});

RepairSchema.virtual('dateOutFMT').get(function () {
    return format('MM/dd/yyyy', this.dateOut);
});

RepairSchema.virtual('customerApprovedDateFMT').get(function () {
    return format('MM/dd/yyyy', this.customerApprovedDate);
});

RepairSchema.virtual('repairCostFMT').get(function () {
    if(this.repairCost==null) return "";
    else return formatCurrency(this.repairCost, opts);
});

export const Repair = mongoose.models.Repair || mongoose.model('Repair', RepairSchema);
