"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit } from "lucide-react";
import { customerSchema } from "@/lib/models/customer";
import { z } from "zod";
import { useRouter } from "next/navigation";

type Customer = z.infer<typeof customerSchema>;

interface CustomerActionMenuProps {
    customer: Customer;
}

export function CustomerActionMenu({ customer }: CustomerActionMenuProps) {
    const router = useRouter();

    const handleEdit = () => {
        router.push(`/customers/${customer._id}/edit`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
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
