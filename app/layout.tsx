
import { Metadata } from 'next';
import "./globals.css";
import { Toaster } from "react-hot-toast";
import "../lib/console-timestamp"; // Add timestamps to all console logs
import { TestInstanceIndicator } from "@/components/test-instance-indicator";



export const metadata: Metadata = {
  title: {
    template: '%s | Inventory',
    default: 'Inventory',
  },
  description: 'Inventory, repairs, and invoices for your business.'
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <body>
          <TestInstanceIndicator />
          <div>
            {children}
          </div>
          <Toaster position="top-right" />
        </body>
    </html>
  );
}
