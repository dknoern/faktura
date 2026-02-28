import mongoose from "mongoose";

var ProposalLineItemSchema = new mongoose.Schema({
    name: String,
    longDesc: String,
    amount: Number
});

var ProposalSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customer' },
    customerNumber: Number,
    customerFirstName: String,
    customerLastName: String,
    date: Date,
    total: Number,
    search: String,
    lineItems: {
        type: [ProposalLineItemSchema]
    },
    status: String,
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
});

export const Proposal = mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
