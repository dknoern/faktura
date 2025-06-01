import { productModel } from "../models/product";

export async function updateProductHistory(lineItems: any[], status: string, action: string, user: string, refDoc: string) {

    for (var i = 0; lineItems != null && i < lineItems.length; i++) {
        var lineItem = lineItems[i];

        if (lineItem.productId != null && lineItem.productId != '') {

            var historyEntry = {
                user: user,
                date: Date.now(),
                action: action,
                refDoc: null as string | null
            };

            if (refDoc != null) {
                historyEntry.refDoc = refDoc;
            }

            await productModel.findOneAndUpdate({
                _id: lineItem.productId,
                status: { $ne: status }

            }, {
                "$push": {
                    "history": historyEntry
                },
                "$set": {
                    "status": status,
                    "lastUpdated": new Date()
                }
            }, {
                upsert: false, useFindAndModify: false
            });
            console.log('updated product', lineItem.productId,'history and set status to',status);
        }
    }
}