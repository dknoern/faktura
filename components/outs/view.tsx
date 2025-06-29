"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutActionMenu } from "./out-action-menu";

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

export function ViewOut({ out }: { out: Out }) {

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
        <OutActionMenu out={out} />
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

        {/* Signature Information */}
        {(out.signature || out.signatureDate || out.signatureUser) && (
          <Card>
            <CardHeader>
              <CardTitle>Signature Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {out.signature && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signature</label>
                  <p className="text-sm">{out.signature}</p>
                </div>
              )}
              {out.signatureDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signature Date</label>
                  <p className="text-sm">{formatDateTime(out.signatureDate)}</p>
                </div>
              )}
              {out.signatureUser && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signed By</label>
                  <p className="text-sm">{out.signatureUser}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
    </div>
  );
}
