"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { logSchema } from "@/lib/models/log";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { createLog, updateLog } from "@/app/actions/logs";
import { searchRepairItems } from "@/app/actions/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, ShoppingBag, FileText, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductSelectDialog } from "./product-select-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const CARRIER_OPTIONS = [
  "FedEx",
  "UPS",
  "USPS",
  "Courier",
  "Other"
] as const;

type LogFormValues = z.infer<typeof logSchema>;

type LineItem = {
  itemNumber?: string;
  name?: string;
  repairNumber?: string;
  repairCost?: number;
  productId?: string;
  repairId?: string;
};

export function LogForm({ log }: { log?: z.infer<typeof logSchema> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  // Modals state
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [miscModalOpen, setMiscModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  
  // Repair search state
  const [repairSearchQuery, setRepairSearchQuery] = useState("");
  const [repairSearchResults, setRepairSearchResults] = useState<any[]>([]);
  const [isSearchingRepairs, setIsSearchingRepairs] = useState(false);
  
  // Misc item state
  const [miscItemName, setMiscItemName] = useState("");

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date: new Date(),
      receivedFrom: undefined,
      comments: "",
      user: "",
      customerName: "",
      lineItems: [],
    },
  });

  async function onSubmit(data: LogFormValues) {
    try {
      setError(null);
      setIsSubmitting(true);

      // Ensure date is a proper Date object and include id if it exists
      const formData = {
        ...data,
        date: new Date(data.date),
        lineItems: lineItems,
        id: log?.id // Include the id if it exists
      };

      const result = log?.id
        ? await updateLog(log.id, formData)
        : await createLog(formData);

      if (!result.success) {
        setError(result.error || `Failed to ${log?.id ? 'update' : 'create'} log item. Please try again.`);
        return;
      }

      router.push("/dashboard/loginitems");
    } catch (error) {
      console.error('Error saving log item:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle inventory item selection
  function handleProductSelect(product: any) {
    const newItem: LineItem = {
      itemNumber: product.itemNumber,
      name: product.title,
      productId: product._id,
    };
    setLineItems([...lineItems, newItem]);
  }
  
  // Search for repair items
  async function handleRepairSearch() {
    if (!repairSearchQuery.trim()) return;
    
    setIsSearchingRepairs(true);
    try {
      const result = await searchRepairItems(repairSearchQuery);
      if (result.success) {
        setRepairSearchResults(result.data);
      }
    } catch (error) {
      console.error('Error searching repair items:', error);
    } finally {
      setIsSearchingRepairs(false);
    }
  }
  
  // Add repair item to line items
  function addRepairItem(repair: any) {
    const newItem: LineItem = {
      itemNumber: repair.itemNumber,
      name: repair.description,
      repairNumber: repair.repairNumber,
      repairCost: repair.repairCost,
      repairId: repair._id,
    };
    setLineItems([...lineItems, newItem]);
    setRepairModalOpen(false);
  }
  
  // Add misc item to line items
  function handleAddMiscItem() {
    if (miscItemName.trim()) {
      const newItem: LineItem = {
        name: miscItemName,
      };
      setLineItems([...lineItems, newItem]);
      setMiscItemName("");
      setMiscModalOpen(false);
    }
  }
  
  // Remove item from line items
  function removeLineItem(index: number) {
    const updatedItems = [...lineItems];
    updatedItems.splice(index, 1);
    setLineItems(updatedItems);
  }

  useEffect(() => {
    if (log) {
      form.reset({
        date: new Date(log.date),
        receivedFrom: log.receivedFrom,
        comments: log.comments || "",
        user: log.user || "",
        customerName: log.customerName || "",
        lineItems: log.lineItems || [],
      });
      
      // Set line items from the log
      if (log.lineItems && log.lineItems.length > 0) {
        setLineItems(log.lineItems);
      }
    }
  }, [form, log]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem hidden={!log?.id}>
                <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    value={field.value instanceof Date 
                      ? field.value.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).split('/').reverse().join('-') + 'T' + 
                        field.value.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })
                      : ''} 
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : new Date();
                      field.onChange(date);
                    }}
                    disabled
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receivedFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Received From <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={log?.receivedFrom}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARRIER_OPTIONS.map((carrier) => (
                        <SelectItem key={carrier} value={carrier}>
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Received By</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note/Comment</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Line Items Section */}
        <div className="mt-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Items</CardTitle>
                <div className="flex gap-2">
                  {/* Inventory Item Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      setInventoryModalOpen(true);
                    }}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" /> Inventory Item
                  </Button>
                  
                  {/* Misc Item Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      setMiscModalOpen(true);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Misc Item
                  </Button>
                  
                  {/* Repair Return Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      setRepairModalOpen(true);
                    }}
                  >
                    <Wrench className="mr-2 h-4 w-4" /> Repair Return
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lineItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Received</TableHead>
                        <TableHead>Item Number</TableHead>
                        <TableHead>Repair Number</TableHead>
                        <TableHead className="text-right">Repair Cost</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name || "-"}</TableCell>
                          <TableCell>{item.itemNumber || "-"}</TableCell>
                          <TableCell>{item.repairNumber || "-"}</TableCell>
                          <TableCell className="text-right">{item.repairCost ? `$${item.repairCost.toFixed(2)}` : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeLineItem(index)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No items added yet. Use the buttons above to add inventory, misc, or repair items.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Product Select Dialog for Inventory Items */}
        <ProductSelectDialog
          open={inventoryModalOpen}
          onOpenChange={setInventoryModalOpen}
          onProductSelect={handleProductSelect}
        />
        
        {/* Misc Item Modal */}
        <Dialog open={miscModalOpen} onOpenChange={setMiscModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Miscellaneous Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">Item Name</FormLabel>
                <Input
                  id="miscItemName"
                  placeholder="Enter item name"
                  className="col-span-3"
                  value={miscItemName}
                  onChange={(e) => setMiscItemName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMiscModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMiscItem} disabled={!miscItemName.trim()}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Repair Search Modal */}
        <Dialog open={repairModalOpen} onOpenChange={setRepairModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Add Repair Item</DialogTitle>
            </DialogHeader>
            
            <div className="flex mb-4 mt-4">
              <Input 
                placeholder="Search repair items by number or description..." 
                value={repairSearchQuery}
                onChange={(e) => setRepairSearchQuery(e.target.value)}
                className="flex-1 mr-2"
              />
              <Button onClick={handleRepairSearch} disabled={isSearchingRepairs}>
                {isSearchingRepairs ? "Searching..." : "Search"}
              </Button>
            </div>
            
            {repairSearchResults.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repair #</TableHead>
                      <TableHead>Item #</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairSearchResults.map((repair: any) => (
                      <TableRow key={repair._id}>
                        <TableCell>{repair.repairNumber}</TableCell>
                        <TableCell>{repair.itemNumber}</TableCell>
                        <TableCell>{repair.description}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => addRepairItem(repair)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {isSearchingRepairs ? "Searching..." : "Search for repair items by number or description"}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRepairModalOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/loginitems")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (log?.id ? "Updating..." : "Creating...")
              : (log?.id ? "Update Log Item" : "Create Log Item")}
          </Button>
        </div>
      </form>
    </Form>
  );
} 