"use client";

import { CustomerForm } from "@/components/customers/form";
import { Suspense, useEffect } from "react";

function NewCustomerContent() {
  // Clean up any lingering modal styles when component mounts
  useEffect(() => {
    // Remove any modal-related styles that might interfere with form interaction
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('pointer-events');
    
    // Ensure body is scrollable and interactive
    document.body.style.overflow = 'auto';
    document.body.style.pointerEvents = 'auto';
    
    console.log('New customer page: Cleaned up modal styles');
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">New Customer</h2>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <CustomerForm customer={{
          _id: 0,
          firstName: "",
          lastName: "",
          lastUpdated: new Date(),
        }} />
      </div>
    </div>
  );
}

export default function NewCustomerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewCustomerContent />
    </Suspense>
  );
} 