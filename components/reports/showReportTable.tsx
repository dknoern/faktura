"use client";

import { useState, useEffect } from "react";
import { bulkEntryToShow, bulkReleaseFromShow, fetchShowReportData } from "@/lib/actions/show-report-actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast"; // Using custom toast implementation
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Product {
    _id: string;
    itemNumber: string;
    title: string;
    cost: number;
    listPrice: number;
    sellingPrice: number;
    serialNo?: string;
    serialNumber?: string;
}

export function ShowReportTable() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBulkEntryDialog, setShowBulkEntryDialog] = useState(false);
    const [showBulkReleaseDialog, setShowBulkReleaseDialog] = useState(false);
    const [itemNumbers, setItemNumbers] = useState("");
    const [processing, setProcessing] = useState(false);
    // Custom toast implementation
    const toast = ({ title, description }: { title: string; description: string }) => {
        // Simple alert for now - you can replace with your toast implementation
        alert(`${title}: ${description}`);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchShowReportData();
            setProducts(data);
        } catch (err) {
            console.error('Error fetching show report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBulkEntry = async () => {
        if (!itemNumbers.trim()) {
            toast({
                title: "Error",
                description: "Please enter at least one item number",
            });
            return;
        }

        setProcessing(true);
        try {
            // Parse item numbers (space, tab, newline, or comma delimited)
            const parsedItemNumbers = itemNumbers
                .split(/[\s\t\n,]+/)
                .map(num => num.trim())
                .filter(num => num.length > 0);

            const result = await bulkEntryToShow(parsedItemNumbers);
            
            if (result.success) {
                setProducts(result.data);
                toast({
                    title: "Success",
                    description: result.message,
                });
                setShowBulkEntryDialog(false);
                setItemNumbers("");
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to process bulk entry",
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkRelease = async () => {
        setProcessing(true);
        try {
            const result = await bulkReleaseFromShow();
            
            if (result.success) {
                setProducts(result.data);
                toast({
                    title: "Success",
                    description: result.message,
                });
                setShowBulkReleaseDialog(false);
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to process bulk release",
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading show report...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-destructive">{error}</div>
            </div>
        );
    }
    return (
        <div>
            {/* Header with Title and Action Buttons */}
            <div className="flex items-center justify-between mb-6">
                <h2 className='text-2xl font-bold tracking-tight pl-1.5'>Show Report</h2>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => setShowBulkEntryDialog(true)}
                        disabled={processing}
                        variant="outline"
                        size="sm"
                    >
                        Bulk entry to &quot;At Show&quot;
                    </Button>
                    <Button 
                        onClick={() => setShowBulkReleaseDialog(true)}
                        disabled={processing || products.length === 0}
                        variant="outline"
                        size="sm"
                    >
                        Bulk release to &quot;In Stock&quot;
                    </Button>
                </div>
            </div>

            {/* Bulk Entry Dialog */}
            <Dialog open={showBulkEntryDialog} onOpenChange={setShowBulkEntryDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Entry to &quot;At Show&quot;</DialogTitle>
                        <DialogDescription>
                            Enter item numbers for items to send to show. Enter numbers delimited by space, tab or newline.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Enter item numbers separated by spaces, tabs, or new lines..."
                            value={itemNumbers}
                            onChange={(e) => setItemNumbers(e.target.value)}
                            rows={6}
                        />
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowBulkEntryDialog(false);
                                setItemNumbers("");
                            }}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleBulkEntry}
                            disabled={processing || !itemNumbers.trim()}
                        >
                            {processing ? "Processing..." : "Send to Show"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Release Confirmation Dialog */}
            <AlertDialog open={showBulkReleaseDialog} onOpenChange={setShowBulkReleaseDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Release</AlertDialogTitle>
                        <AlertDialogDescription>
                            Release all items from show and place back as &quot;In Stock&quot;?
                            <br />
                            <strong>This will affect {products.length} items currently at show.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleBulkRelease}
                            disabled={processing}
                        >
                            {processing ? "Processing..." : "Confirm Release"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead style={{ whiteSpace: 'nowrap' }}>Item #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Serial</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product._id}>
                        <TableCell>{product.itemNumber}</TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.cost ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.listPrice ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>{Math.ceil(product.sellingPrice ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00','')}</TableCell>
                        <TableCell>{product.serialNo || product.serialNumber || ''}</TableCell>
                     </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
    )
}