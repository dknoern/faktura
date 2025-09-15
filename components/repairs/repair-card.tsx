"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Wrench, DollarSign, Clock } from "lucide-react";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    imageUrl?: string;
}

export function RepairCard({ repair, imageUrl }: RepairCardProps) {
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

    const handleClick = () => {
        // Only navigate if we're not dragging
        if (!isDragging) {
            console.log('Card clicked, navigating to:', `/repairs/${repair._id}/view`);
            router.push(`/repairs/${repair._id}/view`);
        }
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
            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-200 mb-3 relative"
            {...attributes}
            {...listeners}
            onClick={handleClick}
        >
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


                    {/* Repair Image */}
                    {imageUrl && (
                        <div className="mt-2">
                            <div className="relative aspect-square w-full">
                                <Image
                                    src={imageUrl}
                                    alt="Repair image"
                                    fill
                                    className="object-cover rounded-sm"
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}
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
