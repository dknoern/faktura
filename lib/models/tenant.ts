import mongoose from "mongoose";

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
    website: String,
    warranty: String,
    returnPolicy: String,
    bankWireTransferInstructions: String,
    logo: String
});

export const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
