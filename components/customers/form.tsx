"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/lib/models/customer";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const customerFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  cell: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  copyAddress: z.boolean().optional(),
  customerType: z.enum(["Direct", "Dealer"], {
    required_error: "Please select a customer type",
  }),
  status: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function CustomerForm({customer}:{customer: z.infer<typeof customerSchema>}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      phone: "",
      cell: "",
      address1: "",
      address2: "",
      address3: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      copyAddress: false,
      customerType: "Direct",
      status: "Active",
    },
  });

  async function onSubmit(data: CustomerFormValues) {
    try {
      setError(null);
      setIsSubmitting(true);

      const url = customer?._id 
        ? `/api/customers/${customer._id}`
        : "/api/customers";
      
      const method = customer?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || `Failed to ${customer?._id ? 'update' : 'create'} customer. Please try again.`);
        return;
      }

      router.push("/dashboard/customers");
      router.refresh();
    } catch (error) {
      console.error('Error saving customer:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    async function fetchRecord() {
      if (customer) {
        const customerType = customer.customerType === "Direct" || customer.customerType === "Dealer" 
          ? customer.customerType 
          : "Direct";
        
        form.reset({
          firstName: customer.firstName || "",
          lastName: customer.lastName || "",
          company: customer.company || "",
          email: customer.email || "",
          phone: customer.phone || "",
          cell: customer.cell || "",
          address1: customer.address1 || "",
          address2: customer.address2 || "",
          address3: customer.address3 || "",
          city: customer.city || "",
          state: customer.state || "",
          zip: customer.zip || "",
          country: customer.country || "",
          copyAddress: customer.copyAddress || false,
          customerType: customerType as "Direct" | "Dealer",
          status: customer.status || "Active",
        })
      }
    }
    fetchRecord()
  }, [form, customer])



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Type <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={customer.customerType || "Direct"} defaultValue={customer.customerType}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Direct">Direct</SelectItem>
                    <SelectItem value="Dealer">Dealer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="ACME Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="(555) 555-5555" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cell"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cell <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="(555) 555-5555" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="address1"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 1 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address2"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address3"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 3</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="copyAddress"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Copy shipping address to billing address
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/customers")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (customer?._id ? "Updating..." : "Creating...") 
              : (customer?._id ? "Update Customer" : "Create Customer")}
          </Button>
        </div>
      </form>
    </Form>
  );
} 