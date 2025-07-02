"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

export function EmailDialog({ open, onOpenChange, invoiceId }: EmailDialogProps) {
  const [emailAddresses, setEmailAddresses] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to reset any lingering scroll locks or pointer events
  const resetBodyStyles = () => {
    // Remove any scroll locks that might be lingering
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    document.body.style.paddingRight = '';
    
    // Remove any data attributes that might be set by the dialog
    document.body.removeAttribute('data-scroll-locked');
    
    // Force a small reflow/repaint
    void document.body.offsetHeight;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!open) {
        resetBodyStyles();
      }
    };
  }, [open]);

  const handleSend = async () => {
    if (!emailAddresses.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    // Basic email validation
    const emails = emailAddresses.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email address${invalidEmails.length > 1 ? 'es' : ''}: ${invalidEmails.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/email/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          email: emailAddresses,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Email sent successfully!');
        setEmailAddresses("");
        // Close dialog and reset styles
        onOpenChange(false);
        setTimeout(() => resetBodyStyles(), 100);
      } else {
        toast.error(`Error: ${data.error || 'Failed to send email'}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error: Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEmailAddresses("");
    onOpenChange(false);
    setTimeout(() => resetBodyStyles(), 100);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // Force reset any lingering scroll locks when dialog closes
        setTimeout(() => resetBodyStyles(), 100);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice via Email
          </DialogTitle>
          <DialogDescription>
            Enter one or more email addresses (comma-separated) to send this invoice to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email-addresses">
              Email Addresses <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email-addresses"
              placeholder="email@example.com, another@example.com"
              value={emailAddresses}
              onChange={(e) => setEmailAddresses(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple email addresses with commas
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
