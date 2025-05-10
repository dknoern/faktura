"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { logSchema } from "@/lib/models/log";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea} from "@/components/ui/textarea";
import { createLog, updateLog } from "@/app/actions/logs";
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
import { ProductSelectModal } from "@/components/invoices/product-select-modal";
import { RepairSelectModal } from "@/components/logs/repair-select-modal";
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

export function LogForm({ log, user }: { log?: z.infer<typeof logSchema>, user?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  // Modals state
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [miscModalOpen, setMiscModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  
  // We don't need the repair search state anymore as it's handled by the modal
  
  // Misc item state
  const [miscItemName, setMiscItemName] = useState("");

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date: new Date(),
      receivedFrom: log?.receivedFrom || undefined,
      comments: log?.comments || "",
      user: log?.user || user || "",
      customerName: log?.customerName || "",
      lineItems: [],
    },
  });
  
  // Initialize form values and line items if editing an existing log
  useEffect(() => {
    if (log?.id) {
      // Set line items from existing log
      if (log.lineItems && log.lineItems.length > 0) {
        setLineItems(log.lineItems);
      }
    } else {
      // Ensure date is set for new logs
      form.setValue("date", new Date());
    }
    
    // Log the form state for debugging
    console.log("Form initialized with values:", form.getValues());
  }, [log, form]);

  async function onSubmit(data: LogFormValues) {
    try {
      setError(null);
      setIsSubmitting(true);
      console.log("Form submission started", { data, lineItems });

      // Validate that there is at least one line item
      if (!log?.id && lineItems.length === 0) {
        setError("At least one item must be added before saving.");
        setIsSubmitting(false);
        return;
      }

      // Ensure date is a proper Date object and include id if it exists
      const formData = {
        ...data,
        date: data.date instanceof Date ? data.date : new Date(),
        lineItems: lineItems,
        id: log?.id // Include the id if it exists
      };
      
      console.log("Submitting form data:", formData);

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
  
  // Add repair item to line items
  function handleRepairSelect(repair: any) {
    const newItem: LineItem = {
      itemNumber: repair.itemNumber,
      name: repair.description,
      repairNumber: repair.repairNumber,
      repairCost: repair.repairCost,
      repairId: repair._id,
    };
    setLineItems([...lineItems, newItem]);
    // Modal is closed automatically by RepairSelectModal
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
  
  // Update repair cost for a line item
  function updateLineItemCost(index: number, cost: string) {
    const updatedItems = [...lineItems];
    const numericCost = parseFloat(cost);
    // Only update if it's a valid number
    if (!isNaN(numericCost)) {
      updatedItems[index] = {
        ...updatedItems[index],
        repairCost: numericCost
      };
      setLineItems(updatedItems);
    }
  }
  
  // Update item name for a line item
  function updateLineItemName(index: number, name: string) {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      name: name
    };
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
      <form onSubmit={(e) => {
        e.preventDefault();
        const formValues = form.getValues();
        console.log("Form submitted with values:", formValues);
        onSubmit(formValues);
      }} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">


          
          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Date <span className="text-red-500">*</span></label>
            <Input
              value={log?.date ? new Date(log.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : new Date().toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
              type="text"
              disabled
            />
          </div>







          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Received From <span className="text-red-500">*</span></label>
            <Select 
              value={form.watch("receivedFrom") || ""}
              onValueChange={(value) => form.setValue("receivedFrom", value)}
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
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Customer Name</label>
            <Input
              value={form.watch("customerName") || ""}
              onChange={(e) => form.setValue("customerName", e.target.value)}
            />
          </div>


          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Received By</label>
            <Input
              value={form.watch("user") || ""}
              onChange={(e) => form.setValue("user", e.target.value)}
            />
          </div>


          <div className="grid grid-cols-[120px_1fr] items-center">
            <label className="text-sm font-medium">Note/Comment</label>
            <Textarea
              value={form.watch("comments") || ""}
              onChange={(e) => form.setValue("comments", e.target.value)}
            />
          </div>
        </div>
        
        {/* Line Items Section */}
        <div className="mt-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Items</CardTitle>
                {!log?.id && (
                <div className="flex gap-2">
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
              )}
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
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              type="text"
                              placeholder="Item description"
                              value={item.name || ""}
                              onChange={(e) => updateLineItemName(index, e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <a 
                              href={`/dashboard/products/${item.productId}/edit`}
                              className="text-[rgb(98,90,250)] hover:text-black"
                            >
                              {item.itemNumber || ""}
                            </a>
                          </TableCell>
                          <TableCell><a href={`/dashboard/repairs/${item.repairNumber}/view`} className="text-[rgb(98,90,250)] hover:text-black">{item.repairNumber || ""}</a></TableCell>
                          <TableCell className="text-right">
                            {/* Only show repair cost input if it's a repair item */}
                            {(item.repairId || item.repairNumber) ? (
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={item.repairCost || ""}
                                onChange={(e) => updateLineItemCost(index, e.target.value)}
                                className="w-24 text-right inline-block"
                                step="0.01"
                                min="0"
                              />
                            ) : ""}                            
                          </TableCell>
                          <TableCell className="text-right">
                            {!log?.id && (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeLineItem(index)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                            )}
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
        
        {/* Product Select Modal for Inventory Items */}
        <ProductSelectModal
          isOpen={inventoryModalOpen}
          onClose={() => setInventoryModalOpen(false)}
          onProductSelect={(product) => {
            handleProductSelect(product);
            // Modal is closed automatically by ProductSelectModal
          }}
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
        
        {/* Repair Select Modal */}
        <RepairSelectModal
          isOpen={repairModalOpen}
          onClose={() => setRepairModalOpen(false)}
          onRepairSelect={(repair) => {
            handleRepairSelect(repair);
            // Modal is closed automatically by RepairSelectModal
          }}
        />

        <div className="flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/loginitems")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={isSubmitting || (!log?.id && lineItems.length === 0) || !form.watch("receivedFrom")}
            title={!form.watch("receivedFrom") ? "'Received From' must be selected" : (!log?.id && lineItems.length === 0 ? "At least one item is required" : undefined)}
            onClick={() => {
              if (!form.watch("receivedFrom")) {
                setError("'Received From' must be selected before saving.");
                return;
              }
              if (!log?.id && lineItems.length === 0) {
                setError("At least one item must be added before saving.");
                return;
              }
              
              // Manually trigger form submission
              const formValues = form.getValues();
              console.log("Manual submission with values:", formValues);
              onSubmit(formValues);
            }}
          >
            {isSubmitting
              ? (log?.id ? "Updating..." : "Creating...")
              : (log?.id ? "Update Log Item" : "Create Log Item")}
          </Button>
        </div>
        
        {!form.watch("receivedFrom") && (
          <div className="text-center text-sm text-amber-600 mt-2">
            <i>Received From</i> must be selected before saving
          </div>
        )}
        {form.watch("receivedFrom") && !log?.id && lineItems.length === 0 && (
          <div className="text-center text-sm text-amber-600 mt-2">
            At least one item must be added before saving
          </div>
        )}
      </form>
    </Form>
  );
} 