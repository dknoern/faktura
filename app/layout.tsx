
import { Metadata } from 'next';
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import "../lib/console-timestamp"; // Add timestamps to all console logs


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});



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
          <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`} style={{ 
            background: `url("/rolex-sky-dweller.jpg") center/cover no-repeat, linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)` 
          }}>
            {children}
          </div>
          <Toaster position="top-right" />
        </body>
    </html>
  );
}
