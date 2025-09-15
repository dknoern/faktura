"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Wrench, DollarSign, Clock } from "lucide-react";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';

interface Repair {
    _id: string;
    repairNumber: string;
    itemNumber: string;
    description: string;
    dateOut: string | null;
    customerApprovedDate: string | null;
    returnDate: string | null;
    customerFirstName: string;
    customerLastName: string;
    vendor: string;
    repairCost: number;
}

interface RepairCardProps {
    repair: Repair;
}

export function RepairCard({ repair }: RepairCardProps) {
    const router = useRouter();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: repair._id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Card clicked, navigating to:', `/repairs/${repair._id}/view`);
        router.push(`/repairs/${repair._id}/view`);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    };


    return (
        <Card 
            ref={setNodeRef}
            style={style}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 mb-3 relative"
            {...attributes}
            onClick={handleClick}
        >
            <div 
                className="absolute top-2 right-2 w-6 h-6 cursor-grab active:cursor-grabbing z-10"
                {...listeners}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full ml-1"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full ml-1"></div>
                </div>
            </div>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium truncate">
                        Repair #{repair.repairNumber} {repair.customerFirstName} {repair.customerLastName}
                    </CardTitle>
                </div>
                <div className="text-xs text-muted-foreground">
                    {repair.itemNumber}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    <p className="text-sm text-gray-700 line-clamp-2">
                        {repair.description}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate">
                            {repair.customerFirstName} {repair.customerLastName}
                        </span>
                    </div>

                    {repair.vendor && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Wrench className="h-3 w-3" />
                            <span className="truncate">{repair.vendor}</span>
                        </div>
                    )}

                    {repair.repairCost > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>${repair.repairCost.toFixed(2)}</span>
                        </div>
                    )}

                    {repair.dateOut && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Out: {formatDate(repair.dateOut)}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
