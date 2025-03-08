import { fetchProductById } from "@/lib/data";

export async function ProductsTable(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const product = await fetchProductById(id);
    return (
        <div>
            <p>Product</p>
            <p>{product.title}</p>

        </div>

    )
}