"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Edit, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface Wanted {
  _id: string;
  title: string;
  description: string;
  customerName: string;
  customerId: number;
  createdDate: string;
  foundDate: string | null;
  createdBy?: string;
  foundBy?: string;
}

interface WantedActionMenuProps {
  wanted: Wanted;
}

export function WantedActionMenu({ wanted }: WantedActionMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    router.push(`/wanted/${wanted._id}/edit`);
  };

  const handleMarkAsFound = async () => {
    if (wanted.foundDate) {
      toast.error("Item is already marked as found");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/wanted/${wanted._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...wanted,
          foundDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Item marked as found!");
        window.location.reload();
      } else {
        toast.error("Failed to mark item as found");
      }
    } catch (error) {
      console.error('Error marking item as found:', error);
      toast.error("Failed to mark item as found");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          Actions <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {!wanted.foundDate && (
          <DropdownMenuItem onClick={handleMarkAsFound}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Found
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
