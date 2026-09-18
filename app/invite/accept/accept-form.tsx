"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { acceptVendorInvite } from "@/lib/actions/vendor-invite-actions";

const acceptInviteFormSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AcceptInviteFormValues = z.infer<typeof acceptInviteFormSchema>;

interface AcceptInviteFormProps {
  vendorId: string;
  token: string;
  email: string;
  firstName?: string;
  tenantName: string;
}

export function AcceptInviteForm({ vendorId, token, email, firstName, tenantName }: AcceptInviteFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const form = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: AcceptInviteFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await acceptVendorInvite(vendorId, token, values);
      if (!result.success) {
        setError(result.error || "Failed to activate your account");
        Object.entries(result.fieldErrors || {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof AcceptInviteFormValues, { message: messages[0] });
          }
        });
        return;
      }
      setAccepted(true);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (accepted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Your account is ready</CardTitle>
          <CardDescription>
            Welcome aboard{firstName ? `, ${firstName}` : ''}! Sign in with your email
            (<strong>{email}</strong>) and the password you just set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href={`/invite/signin?email=${encodeURIComponent(email)}`}>Sign in</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Accept your invitation</CardTitle>
        <CardDescription>
          <strong>{tenantName}</strong> has invited you to join them as a vendor.
          Set a password for <strong>{email}</strong> to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Activating account..." : "Accept invitation"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
