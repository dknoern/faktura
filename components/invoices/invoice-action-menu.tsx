"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ChevronDown, Printer, Mail, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/lib/invoice-renderer";
import toast from "react-hot-toast";

interface InvoiceActionMenuProps {
    invoice: Invoice;
}

export function InvoiceActionMenu({ invoice }: InvoiceActionMenuProps) {
    const router = useRouter();

    const handleEdit = () => {
        router.push(`/invoices/${invoice._id}/edit`);
    };

    const handlePrint = () => {
        window.print();
    };


    // Function to handle return
    const handleReturn = () => {
        router.push(`/returns/new?invoiceId=${invoice._id}`);
    };

    // Function to send email
    const handleEmail = async () => {

        try {
            const response = await fetch('/api/email/send-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoiceId: invoice._id,
                    email: 'david@seattleweb.com',
                }),
            });

            const data = await response.json();

            if (response.ok) {

                // toast success
                toast.success('Email sent successfully!');
            } else {
                toast.error(`Error: ${data.error || 'Failed to send email'}`);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error('Error: Failed to send email');
        }
    };


    return (
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
                <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </DropdownMenuItem>


                <DropdownMenuItem onClick={handleEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                </DropdownMenuItem>


                <DropdownMenuItem onClick={handleReturn}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Create Return
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
