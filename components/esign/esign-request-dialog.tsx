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
import { Send } from "lucide-react";
import toast from "react-hot-toast";

interface EsignRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "repair" | "proposal" | "out" | "invoice";
  id: string;
  defaultEmail?: string;
  defaultPhone?: string;
  docLabel?: string;
}

export function EsignRequestDialog({
  open,
  onOpenChange,
  type,
  id,
  defaultEmail = "",
  defaultPhone = "",
  docLabel,
}: EsignRequestDialogProps) {
  const [emailAddresses, setEmailAddresses] = useState(defaultEmail);
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && defaultEmail) {
      setEmailAddresses(defaultEmail);
    }
    if (open && defaultPhone) {
      setPhoneNumber(defaultPhone);
    }
  }, [open, defaultEmail, defaultPhone]);

  const resetBodyStyles = () => {
    document.body.style.overflow = "";
    document.body.style.pointerEvents = "";
    document.body.style.paddingRight = "";
    document.body.removeAttribute("data-scroll-locked");
    void document.body.offsetHeight;
  };

  useEffect(() => {
    return () => {
      if (!open) {
        resetBodyStyles();
      }
    };
  }, [open]);

  const typeLabel =
    docLabel ||
    (type === "repair"
      ? "Repair Proposal"
      : type === "proposal"
      ? "Proposal"
      : type === "invoice"
      ? "Invoice"
      : "Log Out Item");

  const handleSend = async () => {
    const email = emailAddresses.trim();
    const phone = phoneNumber.trim();

    if (!email && !phone) {
      toast.error("Please enter an email address or mobile number");
      return;
    }

    if (email) {
      const emails = email.split(",").map((e) => e.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter((e) => !emailRegex.test(e));

      if (invalidEmails.length > 0) {
        toast.error(
          `Invalid email address${invalidEmails.length > 1 ? "es" : ""}: ${invalidEmails.join(", ")}`
        );
        return;
      }
    }

    if (phone && phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid mobile number (at least 10 digits)");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/email/send-esign-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          id,
          email,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "E-sign request sent successfully!");
        setEmailAddresses("");
        setPhoneNumber("");
        onOpenChange(false);
        setTimeout(() => resetBodyStyles(), 100);
      } else {
        toast.error(`Error: ${data.error || "Failed to send e-sign request"}`);
      }
    } catch (error) {
      console.error("Error sending e-sign request:", error);
      toast.error("Error: Failed to send e-sign request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEmailAddresses("");
    setPhoneNumber("");
    onOpenChange(false);
    setTimeout(() => resetBodyStyles(), 100);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setTimeout(() => resetBodyStyles(), 100);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Request e-Signature
          </DialogTitle>
          <DialogDescription>
            Send an email or text message requesting the customer to
            electronically sign the {typeLabel.toLowerCase()}. They will
            receive a link to review and sign the document.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="esign-email-addresses">Customer Email</Label>
            <Input
              id="esign-email-addresses"
              placeholder="customer@example.com"
              value={emailAddresses}
              onChange={(e) => setEmailAddresses(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple email addresses with commas
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="esign-phone-number">Mobile Number (SMS)</Label>
            <Input
              id="esign-phone-number"
              type="tel"
              placeholder="(555) 555-0142"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Provide an email, a mobile number, or both
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
            {isLoading ? "Sending..." : "Send e-Sign Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
