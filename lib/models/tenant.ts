import mongoose from "mongoose";


// add features array

const TenantSchema = new mongoose.Schema({
    tenantCode: String,
    isDefault: Boolean,
    name: String,
    nameLong: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    phone: String,
    fax: String,
    website: String,
    warranty: String,
    returnPolicy: String,
    bankWireTransferInstructions: String,
    proposalTerms: String,
    email: String,
    features: {
        products: { type: Boolean, default: true },
        customers: { type: Boolean, default: true },
        proposals: { type: Boolean, default: false },
        invoices: { type: Boolean, default: true },
        returns: { type: Boolean, default: false },
        repairs: { type: Boolean, default: false },
        wanted: { type: Boolean, default: false },
        loginitems: { type: Boolean, default: false },
        logoutitems: { type: Boolean, default: false },
        reports: { type: Boolean, default: false }
    },
    stripe: {
        enabled: { type: Boolean, default: false },
        secretKeyCiphertext: { type: String, select: false },
        secretKeyIv: { type: String, select: false },
        secretKeyTag: { type: String, select: false },
        secretKeyLast4: String,
        publishableKey: String,
        updatedAt: Date
    },
    avatax: {
        enabled: { type: Boolean, default: false },
        username: String,
        passwordCiphertext: { type: String, select: false },
        passwordIv: { type: String, select: false },
        passwordTag: { type: String, select: false },
        passwordLast4: String,
        environment: String,
        companyCode: String,
        updatedAt: Date
    }
});

export const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
