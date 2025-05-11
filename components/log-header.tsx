"use client"

import { LogActionMenu } from "./log-action-menu"

interface LogHeaderProps {
    id: string;
}

export function LogHeader({ id }: LogHeaderProps) {
    return (
        <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Log</h2>
            <LogActionMenu id={id} onUploadComplete={() => window.location.reload()} />
        </div>
    );
}
