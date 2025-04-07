
import { Metadata } from 'next';
 

import localFont from "next/font/local";
import "./globals.css";


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
  description: 'The official Next.js Learn Dashboard built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <body>
        <div className={`flex-grow h-screen flex-col md:flex-row md:overflow-hidden ${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}</div></body>
    </html>
  );
}
