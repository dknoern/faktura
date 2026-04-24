"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface EsignClientProps {
  token: string;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (value: number = 0) => {
  return `$${value.toFixed(2)}`;
};

export function EsignClient({ token }: EsignClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<string | null>(null);
  const [docData, setDocData] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [signed, setSigned] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function fetchDocument() {
      try {
        const response = await fetch(`/api/esign/${token}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Document not found");
          return;
        }

        const result = await response.json();
        setDocType(result.type);
        setDocData(result.data);
        setTenant(result.tenant);

        if (result.data.signature) {
          setAlreadySigned(true);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [token]);

  // Initialize canvas
  useEffect(() => {
    if (!loading && !alreadySigned && !error && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        context.strokeStyle = "#000000";
        context.lineWidth = 2;
        context.lineCap = "round";
        context.lineJoin = "round";
      }
    }
  }, [loading, alreadySigned, error]);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    const context = canvas.getContext("2d");
    if (context) {
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(e);
    const context = canvas.getContext("2d");
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
    const context = canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmitSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is blank
    const context = canvas.getContext("2d");
    if (!context) return;
    const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasDrawing = pixelData.some((channel, index) => {
      // Check alpha channel (every 4th value)
      return index % 4 === 3 && channel !== 0;
    });

    if (!hasDrawing) {
      alert("Please sign in the signature area before submitting.");
      return;
    }

    try {
      setIsSaving(true);
      const signatureData = canvas.toDataURL("image/png");

      const response = await fetch(`/api/esign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: signatureData }),
      });

      const result = await response.json();

      if (response.ok) {
        setSigned(true);
      } else {
        alert(result.error || "Failed to save signature");
      }
    } catch (err) {
      console.error("Error submitting signature:", err);
      alert("Failed to submit signature. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-500">
              Your signature has been recorded successfully. You may close this
              page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Signed</h2>
            <p className="text-gray-500">
              This document has already been signed on{" "}
              {formatDate(docData.signatureDate)}. No further action is needed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Company Header */}
        {tenant && (
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">{tenant.nameLong || tenant.name}</h1>
            {tenant.address && (
              <p className="text-sm text-gray-500">
                {tenant.address}, {tenant.city}, {tenant.state} {tenant.zip}
              </p>
            )}
            {tenant.phone && (
              <p className="text-sm text-gray-500">Phone: {tenant.phone}</p>
            )}
          </div>
        )}

        {/* Document Content */}
        {docType === "repair" && <RepairContent data={docData} />}
        {docType === "proposal" && <ProposalContent data={docData} />}
        {docType === "out" && <OutContent data={docData} />}

        {/* Signature Area */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Electronic Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              By signing below, you acknowledge that you have reviewed the above
              document and agree to its terms. Please use your finger, mouse, or
              stylus to sign.
            </p>

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
              <Button
                variant="outline"
                onClick={clearCanvas}
                disabled={isSaving}
              >
                Clear
              </Button>
              <Button
                onClick={handleSubmitSignature}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? "Submitting..." : "Sign & Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RepairContent({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: "#B69D57" }}>Repair Proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Repair #
            </label>
            <p className="text-sm font-bold">{data.repairNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Date
            </label>
            <p className="text-sm">{formatDate(data.dateOut)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Customer
            </label>
            <p className="text-sm">
              {data.customerFirstName} {data.customerLastName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Vendor
            </label>
            <p className="text-sm">{data.vendor || "N/A"}</p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">ITEM #</TableHead>
                <TableHead className="font-bold">DESCRIPTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold">
                  {data.itemNumber || "N/A"}
                </TableCell>
                <TableCell>{data.description || "N/A"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {data.repairIssues && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Repair Issues
            </label>
            <p className="text-sm whitespace-pre-wrap">{data.repairIssues}</p>
          </div>
        )}

        {data.repairCost != null && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Estimated Cost
            </label>
            <p className="text-sm font-bold">
              {formatCurrency(data.repairCost)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProposalContent({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: "#B69D57" }}>Proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Customer
            </label>
            <p className="text-sm">
              {data.customerFirstName} {data.customerLastName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Date
            </label>
            <p className="text-sm">{formatDate(data.date)}</p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Item</TableHead>
                <TableHead className="text-right font-bold w-[100px]">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lineItems && data.lineItems.length > 0 ? (
                data.lineItems.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="py-3">
                      <div className="font-bold uppercase text-sm">{item.name}</div>
                      {item.longDesc && (
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.longDesc}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3 font-medium text-sm">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No line items
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <div className="flex justify-between w-48 font-bold text-base border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OutContent({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: "#B69D57" }}>Log Out Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Date
            </label>
            <p className="text-sm">{formatDate(data.date)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Sent To
            </label>
            <p className="text-sm">{data.sentTo}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Description
          </label>
          <p className="text-sm">{data.description}</p>
        </div>

        {data.comments && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Comments
            </label>
            <p className="text-sm whitespace-pre-wrap">{data.comments}</p>
          </div>
        )}

        {data.user && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Logged By
            </label>
            <p className="text-sm">{data.user}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
