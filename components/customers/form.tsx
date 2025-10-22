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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCustomer, updateCustomer } from "@/app/actions/customers";

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
  billingAddress1: z.string().optional(),
  billingAddress2: z.string().optional(),
  billingAddress3: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().optional(),
  copyAddress: z.boolean().optional(),
  customerType: z.enum(["Direct", "Dealer"], {
    required_error: "Please select a customer type",
  }),
  status: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function CustomerForm({ customer }: { customer?: z.infer<typeof customerSchema> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if we're in a return flow (e.g., from invoice creation)
  const returnTo = searchParams.get('returnTo');
  const selectCustomer = searchParams.get('selectCustomer') === 'true';

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
      billingAddress1: "",
      billingAddress2: "",
      billingAddress3: "",
      billingCity: "",
      billingState: "",
      billingZip: "",
      billingCountry: "",
      copyAddress: false,
      customerType: "Direct",
      status: "Active",
    },
  });
  
  // Debug: Log form state to help diagnose issues
  console.log('CustomerForm Debug:', {
    customer,
    returnTo,
    selectCustomer,
    formValues: form.getValues(),
    isSubmitting
  });

  async function onSubmit(data: CustomerFormValues) {
    try {
      setError(null);
      setIsSubmitting(true);

      const result = customer?._id
        ? await updateCustomer(customer._id, data)
        : await createCustomer(data);

      if (!result.success) {
        setError(result.error || `Failed to ${customer?._id ? 'update' : 'create'} customer. Please try again.`);
        return;
      }

      // Check if we need to redirect back to invoice or repair
      if ((returnTo === 'invoice' || returnTo === 'repair') && selectCustomer && result.data?._id) {
        const productId = searchParams.get('productId');
        
        if (returnTo === 'invoice') {
          const invoiceUrl = productId 
            ? `/invoices/new?customerId=${result.data._id}&productId=${productId}`
            : `/invoices/new?customerId=${result.data._id}`;
          router.push(invoiceUrl);
        } else if (returnTo === 'repair') {
          const repairUrl = productId 
            ? `/repairs/new?customerId=${result.data._id}&productId=${productId}`
            : `/repairs/new?customerId=${result.data._id}`;
          router.push(repairUrl);
        }
      } else {
        // Default redirect to customers list
        router.push("/customers");
      }
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
          billingAddress1: customer.billingAddress1 || "",
          billingAddress2: customer.billingAddress2 || "",
          billingAddress3: customer.billingAddress3 || "",
          billingCity: customer.billingCity || "",
          billingState: customer.billingState || "",
          billingZip: customer.billingZip || "",
          billingCountry: customer.billingCountry || "",
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
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
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Cell</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Type <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium">Shipping Address</h3>
            </div>


            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </div>

          <div>
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium">Billing Address</h3>

              <FormField
                control={form.control}
                name="copyAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue('billingAddress1', form.getValues('address1'));
                            form.setValue('billingAddress2', form.getValues('address2'));
                            form.setValue('billingAddress3', form.getValues('address3'));
                            form.setValue('billingCity', form.getValues('city'));
                            form.setValue('billingState', form.getValues('state'));
                            form.setValue('billingZip', form.getValues('zip'));
                            form.setValue('billingCountry', form.getValues('country'));
                          } else {
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        (Use shipping)
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="billingAddress1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={form.watch('copyAddress')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingAddress2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={form.watch('copyAddress')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingAddress3"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 3</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={form.watch('copyAddress')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={form.watch('copyAddress')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={form.watch('copyAddress')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={form.watch('copyAddress')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={form.watch('copyAddress')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/customers")}
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