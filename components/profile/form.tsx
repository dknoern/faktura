"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  interests: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ profile }: { profile: any }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      title: profile?.title || "",
      interests: profile?.interests || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserCircle className="size-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is how your name will appear throughout the system.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your job title" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your position or role in the organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Interests or Hobbies</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your interests or hobbies"
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Share your personal interests or hobbies. Separate multiple items with commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}