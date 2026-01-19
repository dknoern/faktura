"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogActionMenu } from "./log-action-menu";
import { ImageGallery } from "@/components/image-gallery";
import { toast } from "react-hot-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LineItem {
  itemNumber?: string;
  name?: string;
  repairNumber?: string;
  repairCost?: number;
  productId?: string;
  repairId?: string;
}

interface Log {
  id?: string;
  _id?: string;
  date: Date | string;
  receivedFrom: string;
  comments?: string;
  user?: string;
  customerName?: string;
  vendor?: string;
  search?: string;
  lineItems?: LineItem[];
  signature?: string;
  signatureDate?: Date | string;
}

interface ViewLogProps {
  log: Log;
  initialImages?: string[];
}

export function ViewLog({ log, initialImages = [] }: ViewLogProps) {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Canvas drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Calculate the scale factor between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get coordinates relative to the canvas and scale them
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);

    const context = canvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(e);

    const context = canvas.getContext('2d');
    if (context) {
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsSaving(true);
      const signatureData = canvas.toDataURL('image/png');
      const logId = log.id || log._id;

      const response = await fetch(`/api/logs/${logId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: signatureData,
          signatureDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save signature');
      }

      toast.success('Signature saved successfully');
      setShowSignaturePad(false);
      // Refresh the page to show updated signature
      window.location.reload();
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize canvas when dialog opens
  React.useEffect(() => {
    if (showSignaturePad && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        // Load existing signature if available
        if (log.signature) {
          const img = new Image();
          img.onload = () => {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = log.signature;
        }
      }
    }
  }, [showSignaturePad, log.signature]);

  return (
    <div className="container mx-auto px-8">

      <div className="bg-white p-8 rounded-lg shadow print:shadow-none">


        {/* Log Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Log Entry</h1>
          <LogActionMenu
            log={log}
            onSignatureClick={() => setShowSignaturePad(true)}
          />
        </div>

        {/* Log Details */}
        <div className="grid gap-8 mb-8 space-y-6">
          <div className="space-y-6">


            <Card>
              <CardHeader>
                <CardTitle>Log In Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">


                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="text-sm">{formatDateTime(log.date)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Received From</label>
                  <p className="text-sm">{log.receivedFrom}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Received By</label>
                  <p className="text-sm">{log.user}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                  <p className="text-sm">{log.customerName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                  <p className="text-sm">{log.vendor}</p>
                </div>

              </CardContent>
            </Card>



            {/* Comments */}
            {log.comments && (
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{log.comments}</p>
                </CardContent>
              </Card>
            )}

            {/* Signature Information */}
            {log.signature && (
              <Card>
                <CardHeader>
                  <CardTitle>Signature Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {log.signatureDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Signed On</label>
                      <p className="text-sm">{formatDateTime(log.signatureDate)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer Signature</label>
                    <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={log.signature} 
                        alt="Customer Signature" 
                        className="max-w-full h-auto"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </div>

        {/* Line Items Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Items Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Item Number</TableHead>
                    <TableHead>Repair Number</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.lineItems && log.lineItems.length > 0 ? (
                    log.lineItems.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">

                        <TableCell>
                          {item.name || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.itemNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {item.repairNumber || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.repairCost ? formatCurrency(item.repairCost) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No items logged
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Image Gallery */}
        {initialImages.length > 0 && (
          <ImageGallery images={initialImages} />
        )}
      </div>

      {/* Custom Signature Canvas */}
      {showSignaturePad && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setShowSignaturePad(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Add Signature</h3>
              <p className="text-sm text-gray-600">Sign using your finger, mouse, or stylus.</p>
            </div>

            <div className="border-2 border-gray-300 rounded-lg mb-4 bg-white">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="w-full h-48 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                disabled={isSaving}
              >
                Clear
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignaturePad(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSignature}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Signature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
