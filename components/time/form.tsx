"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-hot-toast";
import { createTimeEntry } from "@/lib/actions/time-actions";

interface Option {
  id: string;
  label: string;
}

const timeFormSchema = z.object({
  vendorId: z.string().optional(),
  proposalId: z.string().min(1, "Please select a project"),
  date: z.string().min(1, "Please select a date"),
  hours: z.coerce.number({ invalid_type_error: "Enter the number of hours" })
    .min(0.1, "Hours must be at least 0.1")
    .max(24, "Hours cannot exceed 24"),
  comment: z.string().optional(),
});

type TimeFormValues = z.infer<typeof timeFormSchema>;

interface TimeFormProps {
  projects: Option[];
  // Provided only for admins entering time on behalf of a vendor
  vendors?: Option[];
  isAdmin?: boolean;
}

export function TimeForm({ projects, vendors = [], isAdmin = false }: TimeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TimeFormValues>({
    resolver: zodResolver(timeFormSchema) as any,
    defaultValues: {
      vendorId: "",
      proposalId: "",
      date: new Date().toISOString().split('T')[0],
      hours: undefined as unknown as number,
      comment: "",
    },
  });

  async function onSubmit(data: TimeFormValues) {
    if (isAdmin && !data.vendorId) {
      form.setError("vendorId", { message: "Please select a vendor" });
      return;
    }
    try {
      setError(null);
      setIsSubmitting(true);

      const result = await createTimeEntry({
        proposalId: data.proposalId,
        date: data.date,
        hours: data.hours,
        comment: data.comment,
        vendorId: isAdmin ? data.vendorId : undefined,
      });

      if (!result.success) {
        setError(result.error || "Failed to save time entry. Please try again.");
        Object.entries(result.fieldErrors || {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof TimeFormValues, { message: messages[0] });
          }
        });
        return;
      }

      toast.success(isAdmin ? "Time entry saved" : "Time submitted for approval");
      router.push("/time");
    } catch (error) {
      console.error('Error saving time entry:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAdmin && (
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="proposalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="24"
                  placeholder="e.g. 2.5"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Optional notes about this work" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/time")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Time"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
