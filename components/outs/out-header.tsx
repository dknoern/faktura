"use client"

import { OutActionMenu } from "../out-action-menu";

interface LogHeaderProps {
    id: string;
}

export function OutHeader({ id }: LogHeaderProps) {
    return (
        <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Log Out Item</h2>
            <OutActionMenu id={id} onUploadComplete={() => window.location.reload()} />
        </div>
    );
}
