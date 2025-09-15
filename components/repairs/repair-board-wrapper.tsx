"use client"

import dynamic from 'next/dynamic'
import { SkeletonTable } from "@/components/skeletons"

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

interface RepairBoardWrapperProps {
    repairs: Repair[];
}

// Dynamically import RepairBoard with no SSR to prevent hydration issues
const RepairBoard = dynamic(() => import('./repair-board').then(mod => ({ default: mod.RepairBoard })), {
    ssr: false,
    loading: () => <SkeletonTable />
})

export function RepairBoardWrapper({ repairs }: RepairBoardWrapperProps) {
    return <RepairBoard repairs={repairs} />
}
