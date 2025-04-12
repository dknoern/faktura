"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Textarea } from "../ui/textarea"
import { Checkbox } from "../ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter } from "../ui/card"
import Link from "next/link"
import { Table, TableHeader, TableRow, TableBody, TableCell } from "../ui/table"
import { productSchema } from "../../lib/models/product"


export default function ProductEditForm({ product, repairs }: { product: z.infer<typeof productSchema>, repairs: Array<{ _id: string, dateOut: string, returnDate?: string, repairNotes: string, vendor: string, repairCost: number }> }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const isNewProduct = !product.id;

    // 1. Define your form.
    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            productType: "",
            title: "",
            itemNumber: "",
        },
    })

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof productSchema>) {
        setIsSubmitting(true);
        try {
            const endpoint = isNewProduct ? '/api/products' : `/api/products/${product.id}`;
            const method = isNewProduct ? 'POST' : 'PUT';
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });
            
            if (!response.ok) {
                throw new Error('Failed to save product');
            }
            
            //const savedProduct = await response.json();
            
            // On success, redirect to the product list page
            router.push('/dashboard/products');
            router.refresh();
            
        } catch (error) {
            console.error('Error saving product:', error);
            // On failure, stay on the current page and show error
            setSubmitError('Failed to save product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }


    useEffect(() => {
        async function fetchProduct() {

            if (product) {
                form.reset({
                    id: product.id || "",
                    productType: product.productType || "",
                    title: product.title || "",
                    itemNumber: product.itemNumber || "",
                    manufacturer: product.manufacturer || "",
                    model: product.model || "",
                    modelNumber: product.modelNumber || "",
                    condition: product.condition || "",
                    gender: product.gender || "",
                    features: product.features || "",
                    case: product.case || "",
                    dial: product.dial || "",
                    bracelet: product.bracelet || "",
                    serialNo: product.serialNo || "",
                    longDesc: product.longDesc || "",
                    sellerType: product.sellerType || "",
                    seller: product.seller || "",
                    comments: product.comments || "",
                    sellingPrice: product.sellingPrice || 0,
                    //ourPrice: product.ourPrice || 0,
                    listPrice: product.listPrice || 0,
                    cost: product.cost || 0,
                    //repairCost: product.repairCost || 0,
                    //totalCost: product.totalCost || 0,
                    totalRepairCost: product.totalRepairCost || 0,
                    status: product.status || "",
                    ebayNoReserve: product.ebayNoReserve || false,
                    inventoryItem: product.inventoryItem || false,
                    history: product.history || [],
                })
            }
        }
        fetchProduct()
    }, [form, product])

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <div className='grid gap-4 sm:grid-cols-1 lg:grid-cols-2'>
                        <div className='space-y-3'>

                            <input name="id" type="hidden" value={product.id} />
                            <FormField
                                control={form.control}
                                name="productType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Type <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={product.productType}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select product type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Accessories">Accessories</SelectItem>
                                                <SelectItem value="Jewelry">Jewelry</SelectItem>
                                                <SelectItem value="Watch">Watch</SelectItem>
                                                <SelectItem value="PocketWatch">Pocket Watch</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter product title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="manufacturer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Manufacturer</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={product.manufacturer}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select manufacturer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="A. Lange & Sohne">A. Lange & Sohne</SelectItem>
                                                <SelectItem value="Audemars Piguet">Audemars Piguet</SelectItem>
                                                <SelectItem value="Baume & Mercier">Baume & Mercier</SelectItem>
                                                <SelectItem value="Blancpain">Blancpain</SelectItem>
                                                <SelectItem value="Breguet">Breguet</SelectItem>
                                                <SelectItem value="Breitling">Breitling</SelectItem>
                                                <SelectItem value="Bvlgari">Bvlgari</SelectItem>
                                                <SelectItem value="Cartier">Cartier</SelectItem>
                                                <SelectItem value="Chanel">Chanel</SelectItem>
                                                <SelectItem value="Chopard">Chopard</SelectItem>
                                                <SelectItem value="Chronoswiss">Chronoswiss</SelectItem>
                                                <SelectItem value="Concord">Concord</SelectItem>
                                                <SelectItem value="Corum">Corum</SelectItem>
                                                <SelectItem value="Ebel">Ebel</SelectItem>
                                                <SelectItem value="F.P. Journe">F.P. Journe</SelectItem>
                                                <SelectItem value="Franck Muller">Franck Muller</SelectItem>
                                                <SelectItem value="Gerald Genta">Gerald Genta</SelectItem>
                                                <SelectItem value="Girard-Perregaux">Girard-Perregaux</SelectItem>
                                                <SelectItem value="Hublot">Hublot</SelectItem>
                                                <SelectItem value="IWC">IWC</SelectItem>
                                                <SelectItem value="Jaeger-LeCoultre">Jaeger-LeCoultre</SelectItem>
                                                <SelectItem value="Movado">Movado</SelectItem>
                                                <SelectItem value="Omega">Omega</SelectItem>
                                                <SelectItem value="Panerai">Panerai</SelectItem>
                                                <SelectItem value="Parmigiani">Parmigiani</SelectItem>
                                                <SelectItem value="Patek Philippe & Co">Patek Philippe & Co</SelectItem>
                                                <SelectItem value="Piaget">Piaget</SelectItem>
                                                <SelectItem value="Roger Dubuis">Roger Dubuis</SelectItem>
                                                <SelectItem value="Rolex">Rolex</SelectItem>
                                                <SelectItem value="Ulysse Nardin">Ulysse Nardin</SelectItem>
                                                <SelectItem value="Vacheron Constantin">Vacheron Constantin</SelectItem>
                                                <SelectItem value="Additional Brands"></SelectItem>
                                                <SelectItem value="Maurice Lacroix"></SelectItem>
                                                <SelectItem value="Zenith"></SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="itemNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item Number <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="modelNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condition</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={product.condition}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Pre-owned">Pre-owned</SelectItem>
                                                <SelectItem value="Unused">Unused</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={product.gender}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Ladies">Ladies</SelectItem>
                                                <SelectItem value="Men&#39;s">Men&#39;s</SelectItem>
                                                <SelectItem value="Ladies or Me&#39;s">Ladies or Men&#39;s</SelectItem>
                                                <SelectItem value="Midsize">Midsize</SelectItem>
                                                <SelectItem value="Unisex">Unisex</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="features"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Features</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter features" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="case"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Case</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter case" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                control={form.control}
                                name="dial"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dial</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter dial" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bracelet"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bracelet</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter bracelet" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="serialNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Serial No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter bracelet" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="longDesc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Long Desc</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Long description" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className='space-y-3'>
                            <FormField
                                control={form.control}
                                name="sellerType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Seller Type <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={product.sellerType}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select seller type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Individual">Individual</SelectItem>
                                                <SelectItem value="Partner">Partner</SelectItem>
                                                <SelectItem value="Consignment">Consignment</SelectItem>
                                                <SelectItem value="Dealer">Dealer</SelectItem>
                                                <SelectItem value="Auction">Auction</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="seller"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Seller <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seller" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ebayNoReserve"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel>Ebay</FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="inventoryItem"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel>Inventory</FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Status" {...field} value={field.value || ""} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="comments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Box and Papers</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Box and papers" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}

                            />

                            <Tabs defaultValue="financials" className="w-[400px]">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="financials">Financials</TabsTrigger>
                                    <TabsTrigger value="history">History</TabsTrigger>
                                    <TabsTrigger value="repairs">Repairs</TabsTrigger>
                                </TabsList>
                                <TabsContent value="financials">
                                    <Card>

                                        <CardContent className="space-y-2">

                                            <FormField
                                                control={form.control}
                                                name="sellingPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Our price</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="" {...field} value={field.value || ""} />

                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="listPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>List price</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="" {...field} value={field.value || ""} />

                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}

                                            />

                                            <FormField
                                                control={form.control}
                                                name="cost"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cost</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="" {...field} value={field.value || ""} />

                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="totalRepairCost"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Repair Cost</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="" {...field} value={field.value || ""} disabled />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />


                                            <FormField
                                                control={form.control}
                                                name="sellingPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Total Cost</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="" {...field} value={(product.cost || 0) + (product.totalRepairCost || 0)} disabled />

                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                        </CardContent>
                                        <CardFooter />
                                    </Card>
                                </TabsContent>

                                <TabsContent value="history">
                                    <Card>
                                        <CardContent className="space-y-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableCell>User</TableCell>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell>Action</TableCell>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(product.history || []).map((historyEvent) => (
                                                        <TableRow key={historyEvent._id}>
                                                            <TableCell className="font-medium">{historyEvent.user}</TableCell>
                                                            <TableCell>{historyEvent.user}</TableCell>
                                                            <TableCell>{historyEvent.action}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                        <CardFooter />
                                    </Card>
                                </TabsContent>

                                <TabsContent value="repairs">
                                    <Card>
                                        <CardContent className="space-y-2">

                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableCell>Date Out</TableCell>
                                                        <TableCell>Returned</TableCell>
                                                        <TableCell>Noteds</TableCell>
                                                        <TableCell>Vendor</TableCell>
                                                        <TableCell>Cost</TableCell>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {repairs.map((repair: { _id: string, dateOut: string, returnDate?: string, repairNotes: string, vendor: string, repairCost: number }) => (
                                                        <TableRow key={repair._id}>
                                                            <TableCell className="font-medium">{repair.returnDate ? new Date(repair.dateOut).toISOString().split('T')[0] : ''}</TableCell>
                                                            <TableCell>{repair.returnDate ? new Date(repair.returnDate).toISOString().split('T')[0] : ''}</TableCell>
                                                            <TableCell>{repair.repairNotes}</TableCell>
                                                            <TableCell>{repair.vendor}</TableCell>
                                                            <TableCell>{repair.repairCost}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                        <CardFooter />
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {submitError && (
                            <div className="text-red-500 text-center mb-2">
                                {submitError}
                            </div>
                        )}
                        <div className="flex justify-center space-y-0 space-x-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : isNewProduct ? 'Create Product' : 'Update Product'}
                            </Button>
                            <Link href="/dashboard/products"><Button variant="secondary" type="button" disabled={isSubmitting}>Cancel</Button></Link>
                        </div>
                    </div>

                </form>
            </Form>
        </div>
    )
}