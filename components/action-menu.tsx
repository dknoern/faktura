"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Printer } from "lucide-react";

export function ActionMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2">
                    Action
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <a href="#images">Add Images</a>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => window.print()} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
