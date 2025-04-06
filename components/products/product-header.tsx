"use client"

import { ActionMenu } from "../action-menu"

interface ProductHeaderProps {
    id: string;
}

export function ProductHeader({ id }: ProductHeaderProps) {
    return (
        <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Product</h2>
            <ActionMenu id={id} onUploadComplete={() => window.location.reload()} />
        </div>
    );
}
