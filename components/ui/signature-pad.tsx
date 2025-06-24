"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PenLine, Save, Trash2 } from "lucide-react";

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  label?: string;
}

export function SignaturePad({ value, onChange, label = "Signature" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.strokeStyle = '#000000';
        
        // If there's an existing signature, load it
        if (value) {
          const img = new Image();
          img.onload = () => {
            context.drawImage(img, 0, 0);
          };
          img.src = value;
        }
      }
    }
  }, [isOpen, value]);

  // Helper function to get correct coordinates accounting for canvas scaling
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Calculate the actual coordinates accounting for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  // Handle drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    setIsDrawing(true);
    
    const { x, y } = getCoordinates(e);
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const { x, y } = getCoordinates(e);
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return;
    
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    // Check if the canvas is empty (all white)
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const isEmpty = !imageData.some((channel, i) => i % 4 !== 3 && channel !== 255);
    
    if (!isEmpty) {
      onChange(dataUrl);
      setHasSignature(true);
      setIsOpen(false);
    } else {
      alert('Please provide a signature before saving.');
    }
  };

  const removeSignature = () => {
    onChange('');
    setHasSignature(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">{label}</label>
      
      <div className="flex items-center gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant={hasSignature ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              <PenLine size={16} />
              {hasSignature ? "Update Signature" : "Add Signature"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Signature</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Sign using your finger, mouse, or stylus.
              </p>
            </div>
            <div className="border rounded-md overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="touch-none w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-between sm:justify-between mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearCanvas}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear
              </Button>
              <Button 
                type="button" 
                onClick={saveSignature}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save Signature
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {hasSignature && (
          <>
            <Button 
              type="button" 
              variant="outline" 
              onClick={removeSignature}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Remove
            </Button>
            <div className="border rounded-md p-2 bg-white">
              <img 
                src={value} 
                alt="Signature" 
                className="h-12 object-contain" 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
