"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Edit, ChevronDown, Trash2, UserPlus, MailPlus, Banknote } from "lucide-react";
import { vendorSchema } from "@/lib/models/vendor";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteVendor, inviteVendor, resendVendorInvite } from "@/lib/actions/vendor-actions";
import { toast } from "react-hot-toast";
import { PayoutDialog, PayoutSummary } from "./payout-dialog";

type Vendor = z.infer<typeof vendorSchema>;

interface VendorActionMenuProps {
    vendor: Vendor;
    isAdmin?: boolean;
    payout?: PayoutSummary | null;
    onVendorChange?: (vendor: Vendor) => void;
}

export function VendorActionMenu({ vendor, isAdmin = false, payout = null, onVendorChange }: VendorActionMenuProps) {
    const router = useRouter();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showPayoutDialog, setShowPayoutDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    const isInvited = !!vendor.auth0UserId;
    const isAccepted = !!vendor.acceptedAt;

    const handleEdit = () => {
        router.push(`/vendors/${vendor._id}/edit`);
    };

    const handleInviteConfirm = async () => {
        setIsInviting(true);
        try {
            const result = isInvited
                ? await resendVendorInvite(vendor._id.toString())
                : await inviteVendor(vendor._id.toString());
            if (result.success && result.data) {
                toast.success(isInvited ? "Invitation resent" : "Invitation sent");
                onVendorChange?.(result.data);
            } else {
                toast.error(result.error ?? "Failed to send invitation");
            }
        } finally {
            setIsInviting(false);
            setShowInviteDialog(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteVendor(vendor._id.toString());
            if (result.success) {
                router.push('/vendors');
            } else {
                toast.error(result.error ?? "Failed to delete vendor");
                setShowDeleteDialog(false);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Action
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    {isAdmin && !isAccepted && (
                        <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
                            {isInvited ? (
                                <>
                                    <MailPlus className="mr-2 h-4 w-4" />
                                    Resend Invite
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite as User
                                </>
                            )}
                        </DropdownMenuItem>
                    )}
                    {isAdmin && payout && (
                        <DropdownMenuItem
                            disabled={!payout.eligible}
                            onClick={() => setShowPayoutDialog(true)}
                        >
                            <Banknote className="mr-2 h-4 w-4" />
                            Payout
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin && payout && (
                <PayoutDialog
                    vendorId={vendor._id.toString()}
                    vendorName={`${vendor.firstName} ${vendor.lastName}`}
                    payout={payout}
                    open={showPayoutDialog}
                    onOpenChange={setShowPayoutDialog}
                />
            )}

            <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isInvited ? "Resend Invitation" : "Invite Vendor"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isInvited
                                ? `Send a new invitation email to ${vendor.email}? The previous invitation link will stop working.`
                                : `Invite ${vendor.firstName} ${vendor.lastName} (${vendor.email}) as a vendor user? They will receive an email with a link to accept the invitation and set their password.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isInviting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleInviteConfirm} disabled={isInviting}>
                            {isInviting ? "Sending..." : (isInvited ? "Resend" : "Send Invite")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {vendor.firstName} {vendor.lastName}?
                            {isInvited && " This will also revoke their user account access."}
                            {" "}This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
