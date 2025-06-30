"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutActionMenu } from "./out-action-menu";
import { ImageGallery } from "@/components/products/image-gallery";
import { toast } from "react-hot-toast";

interface Out {
  id?: string;
  _id?: string;
  date: Date | string;
  sentTo: string;
  description: string;
  comments?: string;
  user?: string;
  signature?: string;
  signatureDate?: Date | string;
  signatureUser?: string;
}

interface ViewOutProps {
  out: Out;
  initialImages?: string[];
}

export function ViewOut({ out, initialImages = [] }: ViewOutProps) {
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
      const outId = out.id || out._id;

      const response = await fetch(`/api/outs/${outId}`, {
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
        if (out.signature) {
          const img = new Image();
          img.onload = () => {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = out.signature;
        }
      }
    }
  }, [showSignaturePad, out.signature]);

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            Log Out Entry
          </h1>

          <p className="text-lg text-muted-foreground mt-1">
            Sent to {out.sentTo}
          </p>
        </div>
        <OutActionMenu
          out={out}
          onSignatureClick={() => setShowSignaturePad(true)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Log Out Details */}
        <Card>
          <CardHeader>
            <CardTitle>Log Out Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
              <p className="text-sm">{formatDateTime(out.date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sent To</label>
              <p className="text-sm">{out.sentTo}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{out.description}</p>
            </div>
            {out.user && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Logged By</label>
                <p className="text-sm">{out.user}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      {out.comments && (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{out.comments}</p>
          </CardContent>
        </Card>
      )}

      {out.signature && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Signature</CardTitle>
            </CardHeader>
            <CardContent><div>
              <div className="border rounded-md p-4 bg-gray-50">

                <div className="bg-white border rounded-md p-2 inline-block">
                  <img src={out.signature} alt="Signature" className="h-16 object-contain" />
                </div>
                {out.signatureDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Signed on {new Date(out.signatureDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div></CardContent>
          </Card>
        </div>

      )}

      {/* Image Gallery */}
      {initialImages.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ImageGallery images={initialImages} />
          </CardContent>
        </Card>
      )}

      {/* Custom Signature Canvas */}
      {showSignaturePad && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
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
