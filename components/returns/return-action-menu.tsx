"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface Return {
    _id: string;
    customerName: string;
    customerId?: number;
    invoiceId: string;
    returnDate: string;
    subTotal: number;
    taxable: boolean;
    salesTax: number;
    shipping: number;
    totalReturnAmount: number;
    salesPerson?: string;
}

interface ReturnActionMenuProps {
    returnData: Return;
}

export function ReturnActionMenu({ returnData }: ReturnActionMenuProps) {
    const router = useRouter();

    const handleEdit = () => {
        router.push(`/returns/${returnData._id}/edit`);
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
