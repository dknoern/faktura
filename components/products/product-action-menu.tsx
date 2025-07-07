"use client"

import { useState, useRef, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ImagePlus, FileText, Copy, Wrench, Trash2, Plane, Clock, ArrowDown, Unlock, Edit } from "lucide-react";
import { CustomerSelectModalWrapper } from "../customers/select-modal-wrapper";
import { UploadDialog } from "../upload-dialog";
import { toast } from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ProductActionMenuProps {
    id: string;
    customers?: any[];
    pagination?: {
        total: number;
        pages: number;
        currentPage: number;
        limit: number;
    };
    productStatus: string;
}

export function ProductActionMenu({ id, customers = [], productStatus, pagination = { total: 0, pages: 1, currentPage: 1, limit: 10 } }: ProductActionMenuProps) {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showCustomerSelectModal, setShowCustomerSelectModal] = useState(false);
    const [showCustomerSelectModalForRepair, setShowCustomerSelectModalForRepair] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [productData, setProductData] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const mobileFileInputRef = useRef<HTMLInputElement>(null);

    // Detect if device is mobile and fetch product data when component mounts
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsMobile(isMobileDevice || (isTouchDevice && window.innerWidth < 768));
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        const fetchProductData = async () => {
            try {
                const response = await fetch(`/api/products/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setProductData(data);
                }
            } catch (error) {
                console.error('Error fetching product data:', error);
            }
        };
        
        fetchProductData();
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, [id]);
    
    const handleUploadComplete = () => {
        // Reload the page to show the new images
        window.location.reload();
    };
    
    const handleMobileFileUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('id', id);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            // Reload the page to show the new image
            window.location.reload();
        } catch (error) {
            console.error('Error uploading:', error);
            alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };
    
    const handleAddImageClick = () => {
        if (isMobile) {
            // On mobile, go straight to camera
            mobileFileInputRef.current?.click();
        } else {
            // On desktop, show upload dialog
            setShowUploadDialog(true);
        }
    };
    
    // Handle customer selection for invoice creation
    const handleCustomerSelect = (customer: any) => {
        setShowCustomerSelectModal(false);
        
        // Force reset any lingering scroll locks
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        // Use window.location for a full page navigation instead of router.push
        // This ensures a complete page refresh and proper scroll behavior
        window.location.href = `/invoices/new?customerId=${customer._id}&productId=${id}`;
    };

    const handleCustomerSelectForRepair = (customer: any) => {
        setShowCustomerSelectModalForRepair(false);
        
        // Force reset any lingering scroll locks
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        // Use window.location for a full page navigation instead of router.push
        // This ensures a complete page refresh and proper scroll behavior
        window.location.href = `/repairs/new?customerId=${customer._id}&productId=${id}`;
    };

    const handleCloneItem = async () => {
        try {
            // Fetch the current product data
            const response = await fetch(`/api/products/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch product data');
            }
            const productData = await response.json();
            
            // Clear out the fields we don't want to copy
            const clonedData = {
                ...productData,
                id: undefined, // Will get a new ID when saved
                seller: '', // Clear seller
                serialNo: '', // Clear serial number
                itemNumber: '', // Clear item number
                status: 'In Stock',
                cost: undefined // Clear cost as mentioned in the requirement
            };
            // Store the cloned data in sessionStorage to pass to the new product page
            sessionStorage.setItem('clonedProductData', JSON.stringify(clonedData));
            
            // Navigate to new product page
            window.location.href = '/products/new?cloned=true';
        } catch (error) {
            console.error('Error cloning product:', error);
            toast.error('Failed to clone item');
        }
    };

    const handleReturnToStock = async () => {
        if (!productData) {
            toast.error('Product data not loaded');
            return;
        }

        try {
            // Update only the status field
            const updatedData = {
                ...productData,
                status: 'In Stock'
            };

            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error('Failed to update product status');
            }

            // Store success message in sessionStorage to show after reload
            sessionStorage.setItem('statusUpdateSuccess', `Product ${productData.itemNumber} - ${productData.title} returned to stock`);
            
            // Reload the page to reflect the status change
            window.location.reload();
        } catch (error) {
            console.error('Error updating product status:', error);
            toast.error('Failed to update product status');
        }
    };

    const handleOutToShow = async () => {
        if (!productData) {
            toast.error('Product data not loaded');
            return;
        }

        try {
            // Update only the status field
            const updatedData = {
                ...productData,
                status: 'At Show'
            };

            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error('Failed to update product status');
            }

            // Store success message in sessionStorage to show after reload
            sessionStorage.setItem('statusUpdateSuccess', `Product ${productData.itemNumber} - ${productData.title} sent to show`);
            
            // Reload the page to reflect the status change
            window.location.reload();
        } catch (error) {
            console.error('Error updating product status:', error);
            toast.error('Failed to update product status');
        }
    };

    const handleHoldForSalePending = async () => {
        if (!productData) {
            toast.error('Product data not loaded');
            return;
        }

        try {
            // Update only the status field
            const updatedData = {
                ...productData,
                status: 'Sale Pending'
            };

            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error('Failed to update product status');
            }

            // Store success message in sessionStorage to show after reload
            sessionStorage.setItem('statusUpdateSuccess', `Product ${productData.itemNumber} - ${productData.title} held for sale pending`);
            
            // Reload the page to reflect the status change
            window.location.reload();
        } catch (error) {
            console.error('Error updating product status:', error);
            toast.error('Failed to update product status');
        }
    };

    const handleIncoming = async () => {
        if (!productData) {
            toast.error('Product data not loaded');
            return;
        }

        try {
            // Update only the status field
            const updatedData = {
                ...productData,
                status: 'Incoming'
            };

            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error('Failed to update product status');
            }

            // Store success message in sessionStorage to show after reload
            sessionStorage.setItem('statusUpdateSuccess', `Product ${productData.itemNumber} - ${productData.title} marked as incoming`);
            
            // Reload the page to reflect the status change
            window.location.reload();
        } catch (error) {
            console.error('Error updating product status:', error);
            toast.error('Failed to update product status');
        }
    };

    const handleReleaseFromSalePending = async () => {
        if (!productData) {
            toast.error('Product data not loaded');
            return;
        }

        try {
            // Update only the status field
            const updatedData = {
                ...productData,
                status: 'In Stock'
            };

            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error('Failed to update product status');
            }

            // Store success message in sessionStorage to show after reload
            sessionStorage.setItem('statusUpdateSuccess', `Product ${productData.itemNumber} - ${productData.title} released from sale pending`);
            
            // Reload the page to reflect the status change
            window.location.reload();
        } catch (error) {
            console.error('Error updating product status:', error);
            toast.error('Failed to update product status');
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteDialog(true);
    };

    const handleDeleteCancel = () => {
        // Simple solution: just reload the page to reset any state issues
        window.location.reload();
    };

    const handleDeleteConfirm = async () => {
        if (!productData) return;
        
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            // Store success message in sessionStorage to show after navigation
            sessionStorage.setItem('deleteSuccess', `Product ${productData.itemNumber} - ${productData.title} deleted successfully`);
            
            // Navigate to product list
            window.location.href = '/products';
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            setIsDeleting(false);
        }
    };
    
    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline"
                >
                    Action
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => window.location.href = `/products/${id}/edit`} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleAddImageClick} className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Add Image
                </DropdownMenuItem>
                {productStatus === "In Stock" && (
                <DropdownMenuItem onSelect={() => setShowCustomerSelectModal(true)} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Create Invoice
                </DropdownMenuItem>
                )}
                {productStatus != "Repair" && productStatus != "Sale Pending" && productStatus != "At Show" && productStatus != "Incoming" && (
                <DropdownMenuItem onSelect={() => setShowCustomerSelectModalForRepair(true)} className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Repair
                </DropdownMenuItem>                
                )}
                <DropdownMenuItem onSelect={handleCloneItem} className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Clone Item
                </DropdownMenuItem>
                {productStatus === "In Stock" && (
                <DropdownMenuItem onSelect={handleOutToShow} className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Out to Show
                </DropdownMenuItem>
                )}
                {productStatus === "In Stock" && (
                <DropdownMenuItem onSelect={handleHoldForSalePending} className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hold for Sale Pending
                </DropdownMenuItem>
                )}
                {productStatus === "In Stock" && (
                <DropdownMenuItem onSelect={handleIncoming} className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4" />
                    Incoming
                </DropdownMenuItem>
                )}
                {productStatus === "At Show" && (
                <DropdownMenuItem onSelect={handleReturnToStock} className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Return to Stock
                </DropdownMenuItem>
                )}
                {productStatus === "Sale Pending" && (
                <DropdownMenuItem onSelect={handleReleaseFromSalePending} className="flex items-center gap-2">
                    <Unlock className="h-4 w-4" />
                    Release from Sale Pending
                </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onSelect={handleDeleteClick} 
                    className="flex items-center gap-2"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Upload dialog for desktop */}
        <UploadDialog
            id={id}
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onUploadComplete={handleUploadComplete}
        />
        
        {/* Hidden input for mobile camera */}
        <input
            type="file"
            ref={mobileFileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    handleMobileFileUpload(file);
                }
                // Reset the input to allow selecting the same file again
                e.target.value = '';
            }}
        />
        
        {/* Customer selection modal for invoice creation */}
        <CustomerSelectModalWrapper
            isOpen={showCustomerSelectModal}
            onClose={() => setShowCustomerSelectModal(false)}
            onSelect={handleCustomerSelect}
            customers={customers}
            pagination={pagination}
        />
        
        {/* Customer selection modal for repair creation */}
        <CustomerSelectModalWrapper
            isOpen={showCustomerSelectModalForRepair}
            onClose={() => window.location.reload()}
            onSelect={handleCustomerSelectForRepair}
            customers={customers}
            pagination={pagination}
        />

        {/* Delete confirmation dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={(open) => !open && handleDeleteCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>
                            {productData?.itemNumber} - {productData?.title}
                        </strong>
                        ?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleDeleteCancel}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
