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
import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-hot-toast";
import { createExpenseEntry } from "@/lib/actions/time-actions";

interface Option {
  id: string;
  label: string;
}

const expenseFormSchema = z.object({
  vendorId: z.string().optional(),
  proposalId: z.string().min(1, "Please select a project"),
  date: z.string().min(1, "Please select a date"),
  amount: z.coerce.number({ invalid_type_error: "Enter an amount" })
    .gt(0, "Amount must be greater than $0"),
  description: z.string().min(1, "Description is required"),
  comment: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  projects: Option[];
  // Provided only for admins entering an expense on behalf of a vendor
  vendors?: Option[];
  isAdmin?: boolean;
}

export function ExpenseForm({ projects, vendors = [], isAdmin = false }: ExpenseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const receiptRef = useRef<HTMLInputElement>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as any,
    defaultValues: {
      vendorId: "",
      proposalId: "",
      date: new Date().toISOString().split('T')[0],
      amount: undefined as unknown as number,
      description: "",
      comment: "",
    },
  });

  async function onSubmit(data: ExpenseFormValues) {
    if (isAdmin && !data.vendorId) {
      form.setError("vendorId", { message: "Please select a vendor" });
      return;
    }
    try {
      setError(null);
      setIsSubmitting(true);

      const formData = new FormData();
      formData.set('proposalId', data.proposalId);
      formData.set('date', data.date);
      formData.set('amount', String(data.amount));
      formData.set('description', data.description);
      if (data.comment) formData.set('comment', data.comment);
      if (isAdmin && data.vendorId) formData.set('vendorId', data.vendorId);
      const receiptFile = receiptRef.current?.files?.[0];
      if (receiptFile) formData.set('receipt', receiptFile);

      const result = await createExpenseEntry(formData);

      if (!result.success) {
        setError(result.error || "Failed to save expense. Please try again.");
        Object.entries(result.fieldErrors || {}).forEach(([field, messages]) => {
          if (messages?.[0] && field !== 'receipt') {
            form.setError(field as keyof ExpenseFormValues, { message: messages[0] });
          }
        });
        return;
      }

      toast.success(isAdmin ? "Expense saved" : "Expense submitted for approval");
      router.push("/time");
    } catch (error) {
      console.error('Error saving expense:', error);
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. Shipping supplies" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (USD) <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 45.99"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Receipt</FormLabel>
          <FormControl>
            <Input
              type="file"
              ref={receiptRef}
              accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.pdf"
            />
          </FormControl>
          <p className="text-xs text-muted-foreground">Optional — image or PDF, up to 10MB.</p>
        </FormItem>

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Optional notes about this expense" {...field} />
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
            {isSubmitting ? "Submitting..." : "Submit Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
