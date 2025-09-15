"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RepairCard } from "./repair-card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core'
import { toast } from "react-hot-toast"

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

interface RepairBoardProps {
    repairs: Repair[];
}

interface BoardColumn {
    id: string;
    title: string;
    repairs: Repair[];
    color: string;
    vendorValue: string | null;
}

// Droppable Column Component
function DroppableColumn({ column, repairImages }: { column: BoardColumn; repairImages: Record<string, string> }) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-80">
            <Card className={`${column.color} ${isOver ? 'ring-2 ring-blue-400' : ''}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                            {column.title}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {column.repairs.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-3">
                        {column.repairs.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-8">
                                No repairs in this column
                            </div>
                        ) : (
                            column.repairs.map((repair) => (
                                <RepairCard 
                                    key={repair._id} 
                                    repair={repair} 
                                    imageUrl={repairImages[repair._id]}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function RepairBoard({ repairs }: RepairBoardProps) {
    const [repairsList, setRepairsList] = useState(repairs);
    const [activeRepair, setActiveRepair] = useState<Repair | null>(null);
    const [repairImages, setRepairImages] = useState<Record<string, string>>({});

    // Sync state with prop changes
    useEffect(() => {
        setRepairsList(repairs);
    }, [repairs]);

    // Fetch bulk repair images
    useEffect(() => {
        const fetchRepairImages = async () => {
            try {
                const response = await fetch('/api/repairs/images/bulk');
                if (response.ok) {
                    const data = await response.json();
                    setRepairImages(data.repairImages || {});
                }
            } catch (error) {
                console.error('Error fetching bulk repair images:', error);
            }
        };

        fetchRepairImages();
    }, []);

    // Debug logging
    console.log('RepairBoard - Total repairs:', repairs.length);
    console.log('RepairBoard - Repairs data:', repairs);

    // Filter to only show open repairs (no returnDate)
    const openRepairs = repairsList.filter(repair => !repair.returnDate);
    console.log('RepairBoard - Open repairs:', openRepairs.length);

    // Define vendor columns
    const vendorColumns = ['Gyula', 'Smea', 'Patek', 'Ralf', 'Kovacs'];

    // Organize repairs into columns
    const incomingRepairs = openRepairs.filter(repair => 
        !repair.vendor || !vendorColumns.includes(repair.vendor)
    );
    console.log('RepairBoard - Incoming repairs:', incomingRepairs.length);

    const gyulaRepairs = openRepairs.filter(repair => repair.vendor === 'Gyula');
    console.log('RepairBoard - Gyula repairs:', gyulaRepairs.length);

    const smeaRepairs = openRepairs.filter(repair => repair.vendor === 'Smea');
    console.log('RepairBoard - Smea repairs:', smeaRepairs.length);

    const patekRepairs = openRepairs.filter(repair => repair.vendor === 'Patek');
    console.log('RepairBoard - Patek repairs:', patekRepairs.length);

    const ralfRepairs = openRepairs.filter(repair => repair.vendor === 'Ralf');
    console.log('RepairBoard - Ralf repairs:', ralfRepairs.length);

    const kovacsRepairs = openRepairs.filter(repair => repair.vendor === 'Kovacs');
    console.log('RepairBoard - Kovacs repairs:', kovacsRepairs.length);

    const readyRepairs = openRepairs.filter(repair => 
        repair.customerApprovedDate && repair.vendor && vendorColumns.includes(repair.vendor)
    );
    console.log('RepairBoard - Ready repairs:', readyRepairs.length);

    // Log some sample vendor values to debug
    if (openRepairs.length > 0) {
        console.log('Sample repair vendors:', openRepairs.slice(0, 5).map(r => ({ id: r._id, vendor: r.vendor, returnDate: r.returnDate })));
    }

    const columns: BoardColumn[] = [
        {
            id: 'incoming',
            title: 'Incoming',
            repairs: incomingRepairs,
            color: 'bg-blue-50 border-blue-200',
            vendorValue: null
        },
        {
            id: 'gyula',
            title: 'Gyula',
            repairs: gyulaRepairs,
            color: 'bg-green-50 border-green-200',
            vendorValue: 'Gyula'
        },
        {
            id: 'smea',
            title: 'Smea',
            repairs: smeaRepairs,
            color: 'bg-yellow-50 border-yellow-200',
            vendorValue: 'Smea'
        },
        {
            id: 'patek-repair',
            title: 'Patek Repair',
            repairs: patekRepairs,
            color: 'bg-purple-50 border-purple-200',
            vendorValue: 'Patek Repair'
        },
        {
            id: 'ralph-repair',
            title: 'Ralf Repair',
            repairs: ralfRepairs,
            color: 'bg-orange-50 border-orange-200',
            vendorValue: 'Ralf Repair'
        },
        {
            id: 'kovacs',
            title: 'Kovacs',
            repairs: kovacsRepairs,
            color: 'bg-red-50 border-red-200',
            vendorValue: 'Kovacs'
        }

    ];

    const handleDragStart = (event: DragStartEvent) => {
        const repair = openRepairs.find(r => r._id === event.active.id);
        setActiveRepair(repair || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveRepair(null);

        if (!over || active.id === over.id) return;

        const repairId = active.id as string;
        const targetColumnId = over.id as string;
        const targetColumn = columns.find(col => col.id === targetColumnId);

        if (!targetColumn) return;

        const repair = openRepairs.find(r => r._id === repairId);
        if (!repair) return;

        // Don't update if repair is already in the correct column
        const currentVendor = repair.vendor || '';
        const targetVendor = targetColumn.vendorValue || '';
        
        if (currentVendor === targetVendor) return;

        try {
            // Update repair vendor in database using _id
            const response = await fetch(`/api/repairs/${repair._id}/vendor`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vendor: targetVendor }),
            });

            if (!response.ok) {
                throw new Error('Failed to update repair vendor');
            }

            // Update local state
            setRepairsList(prevRepairs => 
                prevRepairs.map(r => 
                    r._id === repairId 
                        ? { ...r, vendor: targetVendor }
                        : r
                )
            );

            toast.success(`Repair moved to ${targetColumn.title}`);
        } catch (error) {
            console.error('Error updating repair vendor:', error);
            toast.error('Failed to move repair');
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full">
                <div className="flex gap-4 h-full overflow-x-auto pb-4">
                    {columns.map((column) => (
                        <DroppableColumn key={column.id} column={column} repairImages={repairImages} />
                    ))}
                </div>
            </div>
            <DragOverlay>
                {activeRepair ? (
                    <div className="opacity-90 rotate-3 transform scale-105">
                        <RepairCard repair={activeRepair} imageUrl={repairImages[activeRepair._id]} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
