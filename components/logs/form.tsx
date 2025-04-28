"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { logSchema, CARRIER_OPTIONS } from "@/lib/models/log";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { createLog, updateLog } from "@/app/actions/logs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LogFormValues = z.infer<typeof logSchema>;

export function LogForm({ log }: { log?: z.infer<typeof logSchema> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date: new Date(),
      receivedFrom: undefined,
      comments: "",
      user: "",
      customerName: "",
      lineItems: [],
    },
  });

  async function onSubmit(data: LogFormValues) {
    try {
      setError(null);
      setIsSubmitting(true);

      // Ensure date is a proper Date object and include id if it exists
      const formData = {
        ...data,
        date: new Date(data.date),
        id: log?.id // Include the id if it exists
      };

      const result = log?.id
        ? await updateLog(log.id, formData)
        : await createLog(formData);

      if (!result.success) {
        setError(result.error || `Failed to ${log?.id ? 'update' : 'create'} log item. Please try again.`);
        return;
      }

      router.push("/dashboard/loginitems");
    } catch (error) {
      console.error('Error saving log item:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (log) {
      form.reset({
        date: new Date(log.date),
        receivedFrom: log.receivedFrom,
        comments: log.comments || "",
        user: log.user || "",
        customerName: log.customerName || "",
        lineItems: log.lineItems || [],
      });
    }
  }, [form, log]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem hidden={!log?.id}>
                <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    value={field.value instanceof Date 
                      ? field.value.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).split('/').reverse().join('-') + 'T' + 
                        field.value.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })
                      : ''} 
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : new Date();
                      field.onChange(date);
                    }}
                    disabled
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receivedFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Received From <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={form.getValues('receivedFrom') || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARRIER_OPTIONS.map((carrier) => (
                        <SelectItem key={carrier} value={carrier}>
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Received By</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note/Comment</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/loginitems")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (log?.id ? "Updating..." : "Creating...")
              : (log?.id ? "Update Log Item" : "Create Log Item")}
          </Button>
        </div>
      </form>
    </Form>
  );
} 