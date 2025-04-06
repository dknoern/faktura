"use client"

import { ActionMenu } from "../action-menu"

interface LogHeaderProps {
    id: string;
}

export function LogHeader({ id }: LogHeaderProps) {
    return (
        <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Log Out Item</h2>
            <ActionMenu id={id} onUploadComplete={() => window.location.reload()} />
        </div>
    );
}
