"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ChevronDown, Printer, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Repair } from "@/lib/repair-renderer";
import { useState } from "react";
import toast from "react-hot-toast";

interface RepairActionMenuProps {
    repair: Repair;
}

export function RepairActionMenu({ repair }: RepairActionMenuProps) {
    const router = useRouter();
    const [isEmailSending, setIsEmailSending] = useState(false);

    const handleEdit = () => {
        router.push(`/repairs/${repair.repairNumber}/edit`);
    };

    const handlePrint = () => {
        window.print();
    };

    // Function to send email
    const handleEmail = async () => {
        setIsEmailSending(true);
        
        try {
            const response = await fetch('/api/email/send-repair', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    repairNumber: repair.repairNumber,
                    email: 'david@seattleweb.com',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Email sent successfully!');
            } else {
                toast.error(`Error: ${data.error || 'Failed to send email'}`);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error('Error: Failed to send email');
        } finally {
            setIsEmailSending(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    disabled={isEmailSending}
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

                <DropdownMenuItem onClick={handleEmail} disabled={isEmailSending}>
                    <Mail className="mr-2 h-4 w-4" />
                    {isEmailSending ? 'Sending...' : 'Email'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
