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
import { useEffect } from "react"

import { Textarea } from "../ui/textarea"
import { Checkbox } from "../ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card"
import Link from "next/link"
import { Table, TableHeader, TableRow, TableBody, TableCell } from "../ui/table"

const formSchema = z.object({
    productType: z.string().min(2, {
        message: "Please select a product type.",
    }),

    title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    }),

    itemNumber: z.string().min(2, {
        message: "Item number must be at least 2 characters.",
    }),

    manufacturer: z.string().min(2, {
        message: "Manufacturer must be at least 2 characters.",
    }),

    model: z.string().min(2, {
        message: "Model must be at least 2 characters.",
    }),

    modelNumber: z.string().min(2, {
        message: "Model number must be at least 2 characters.",
    }),

    condition: z.string().min(2, {
        message: "Condition must be at least 2 characters.",
    }),

    gender: z.string().min(2, {
        message: "Gender must be at least 2 characters.",
    }),

    features: z.string().min(2, {
        message: "Features must be at least 2 characters.",
    }),

    case: z.string().min(2, {
        message: "Case must be at least 2 characters.",
    }),

    dial: z.string().min(2, {
        message: "Dial must be at least 2 characters.",
    }),

    bracelet: z.string().min(2, {
        message: "Bracelet must be at least 2 characters.",
    }),

    serialNo: z.string().min(2, {
        message: "Serial number be at least 2 characters.",
    }),

    longDesc: z.string().min(2, {
        message: "Long description must be at least 2 characters.",
    }),

    sellerType: z.string().min(2, {
        message: "Seller type must be at least 2 characters.",
    }),

    seller: z.string().min(2, {
        message: "Seller must be at least 2 characters.",
    }),

    comments:
        z.string().min(2, {
            message: "Box and papers must be at least 2 characters.",
        }),

    ourPrice: z.number().min(0, {
        message: "Our price must be at least 0.",
    }),

    sellingPrice: z.number().min(0, {
        message: "Selling price must be at least 0.",
    }),

    listPrice: z.number().min(0, {
        message: "List price must be at least 0.",
    }),

    cost: z.number().min(0, {
        message: "Cost must be at least 0.",
    }),

    repairCost: z.number().min(0, {
        message: "Repair cost must be at least 0.",
    }),

    totalCost:
        z.number().min(0, {
            message: "Total cost must be at least 0.",
        }),

    isEbay: z.boolean(),

    isInventory: z.boolean(),

    status: z.string().min(2, {
        message: "Status.",
    }),

    history: z.array(z.object({
        _id: z.string(),
        user: z.string(),
        action: z.string(),
        date: z.string(),
    })),
})


export default function ProductEditForm({ product, foo }: { product: z.infer<typeof formSchema>, foo: string }) {

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productType: "",
            title: "",
            itemNumber: "",
        },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
    }


    useEffect(() => {
        async function fetchProduct() {

            if (product) {
                form.reset({
                    productType: product.productType || "",
                    title: product.title || "",
                    itemNumber: product.itemNumber || "bro",
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
                    ourPrice: product.ourPrice || 0,
                    listPrice: product.listPrice || 0,
                    cost: product.cost || 0,
                    repairCost: product.repairCost || 0,
                    totalCost: product.totalCost || 0,
                    status: product.status || "",
                    isEbay: product.isEbay || false,
                    isInventory: product.isInventory || false,
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
                            <FormField
                                control={form.control}
                                name="productType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Type</FormLabel>
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
                                        <FormLabel>Title</FormLabel>
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
                                        <FormLabel>Item Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="" {...field} />
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
                                                <SelectItem value="Pre-owned">Pro-owned</SelectItem>
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
                                        <FormLabel>Seller Type</FormLabel>
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
                                        <FormLabel>Seller</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seller" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}

                            />

                            <FormField
                                control={form.control}
                                name="seller"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Seller</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seller" {...field} value={field.value || ""} />

                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isEbay"
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
                                name="isInventory"
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
                                                name="repairCost"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Repair Cost</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="" {...field} value={field.value || ""} />

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
                                                            <Input placeholder="" {...field} value={field.value || ""} />

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
                                                    {product.history.map((historyEvent) => (
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
                                        <CardHeader>
                                            <CardTitle>Repairs</CardTitle>
                                            <CardDescription>
                                                Repair info here.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            foo: {foo}

                                        </CardContent>
                                        <CardFooter />
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <div className="flex justify-center space-y-0 space-x-4">
                        <Button type="submit">Submit</Button>
                        <Link href="/dashboard/products"><Button variant="secondary" >Cancel</Button></Link>
                    </div>

                </form>
            </Form>


        </div>
    )
}