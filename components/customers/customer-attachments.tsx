"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, File, FileImage, FileSpreadsheet } from "lucide-react";
import { customerSchema } from "@/lib/models/customer";
import { z } from "zod";
import { format } from "date-fns";
import { useState } from "react";

type Customer = z.infer<typeof customerSchema>;
type Attachment = NonNullable<Customer['attachments']>[0];

interface CustomerAttachmentsProps {
    customer: Customer;
    onAttachmentDeleted?: () => void;
}

export function CustomerAttachments({ customer, onAttachmentDeleted }: CustomerAttachmentsProps) {
    const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

    const getFileIcon = (mimeType: string, fileName: string) => {
        const ext = fileName.toLowerCase().split('.').pop();
        
        if (mimeType.startsWith('image/')) {
            return <FileImage className="h-5 w-5 text-blue-500" />;
        }
        
        switch (ext) {
            case 'pdf':
                return <FileText className="h-5 w-5 text-red-500" />;
            case 'doc':
            case 'docx':
                return <FileText className="h-5 w-5 text-blue-600" />;
            case 'xls':
            case 'xlsx':
                return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
            case 'txt':
                return <FileText className="h-5 w-5 text-gray-600" />;
            default:
                return <File className="h-5 w-5 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = (attachment: Attachment) => {
        const downloadUrl = `/api/customers/attachments/download?fileName=${encodeURIComponent(attachment.fileName)}&originalName=${encodeURIComponent(attachment.originalName)}`;
        window.open(downloadUrl, '_blank');
    };

    const handleDelete = async (attachment: Attachment) => {
        if (!confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) {
            return;
        }

        setDeletingFiles(prev => new Set(prev).add(attachment.fileName));

        try {
            const response = await fetch(`/api/customers/attachments?customerId=${customer._id}&fileName=${encodeURIComponent(attachment.fileName)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete attachment');
            }

            onAttachmentDeleted?.();
        } catch (error) {
            console.error('Error deleting attachment:', error);
            alert('Failed to delete attachment');
        } finally {
            setDeletingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(attachment.fileName);
                return newSet;
            });
        }
    };

    const attachments = customer.attachments || [];

    if (attachments.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Attachments ({attachments.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {attachments.map((attachment, index) => (
                        <div key={`${attachment.fileName}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {getFileIcon(attachment.mimeType, attachment.fileName)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {attachment.originalName}
                                    </p>
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                        <span>{formatFileSize(attachment.fileSize)}</span>
                                        <span>•</span>
                                        <span>{format(new Date(attachment.uploadDate), 'MMM dd, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(attachment)}
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(attachment)}
                                    disabled={deletingFiles.has(attachment.fileName)}
                                    title="Delete"
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
