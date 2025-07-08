import mongoose from "mongoose";

var ProposalLineItemSchema = new mongoose.Schema({
    name: String,
    longDesc: String,
    amount: Number
});

var ProposalSchema = new mongoose.Schema({
    _id: Number,
    customerId: Number,
    customerFirstName: String,
    customerLastName: String,
    date: Date,
    total: Number,
    search: String,
    lineItems: {
        type: [ProposalLineItemSchema]
    },
    status: String
});

export const Proposal = mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
