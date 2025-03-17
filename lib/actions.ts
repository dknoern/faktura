"use server"

import { redirect } from "next/navigation";
import { productSchema } from "./models/product";
import { revalidatePath } from "next/cache";


export type State = {
  errors?: {
    id?: string[];
    title?: string[];
    seller?: string[];
    itemNumber?: string[];
    productType?: string[];
  };
  message?: string | null;
};


export async function submitIt(foo: string) {
  console.log('submitIt, foo:',foo);
}

export async function updateProduct(state: State, formData: FormData): Promise<State> {
    console.log('====================updating product with form data:', formData);

    try {
        const validatedFields = productSchema.parse({
            id: formData.get('id'),
            productType: formData.get('productType'),
            title: formData.get('title'),
            itemNumber: formData.get('itemNumber'),
            manufacturer: formData.get('manufacturer'),
            model: formData.get('model'),
            modelNumber: formData.get('modelNumber'),
            condition: formData.get('condition'),
            gender: formData.get('gender'),
            features: formData.get('features'),
            case: formData.get('case'),
            dial: formData.get('dial'),
            bracelet: formData.get('bracelet'),
            serialNo: formData.get('serialNo'),
            longDesc: formData.get('longDesc'),
            sellerType: formData.get('sellerType'),
            seller: formData.get('seller'),
            comments: formData.get('comments'),
            sellingPrice: Number(formData.get('sellingPrice')) || 0,
            listPrice: Number(formData.get('listPrice')) || 0,
            cost: Number(formData.get('cost')) || 0,
            totalRepairCost: Number(formData.get('totalRepairCost')) || 0,
            status: formData.get('status'),
            ebayNoReserve: formData.get('ebayNoReserve') === 'true',
            inventoryItem: formData.get('inventoryItem') === 'true',
        });

        console.log('Form validation successful:', validatedFields);

        // TODO: Add database update logic here
        // await productModel.findByIdAndUpdate(validatedFields.id, validatedFields);

        revalidatePath('/dashboard/products');
        redirect('/dashboard/products');
    } catch (error) {
        console.error('Error validating form:', error);
        return {
            errors: {
                id: ['Failed to update product'],
            },
            message: 'Failed to update product',
        };
    }
}
