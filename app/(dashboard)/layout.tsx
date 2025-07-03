import localFont from "next/font/local";
import "../globals.css";

import { AppSidebar } from "@/components/app-sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import UserButton from "@/components/user-button";
import { fetchTenantById } from "@/lib/data";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // During build time, database might not be available, so provide fallback
  let tenant = null;
  try {
    // Only attempt to fetch tenant if we have a valid MongoDB URI
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb')) {
      tenant = await fetchTenantById("67f48a2050abe41246b22a87");
    }
  } catch (error) {
    console.warn('Could not fetch tenant during build:', error instanceof Error ? error.message : 'Unknown error');
    // Fallback to null, will use default name
  }
  return (
    <div
      className={`flex h-screen flex-col md:flex-row overflow-hidden ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <SidebarProvider>
        <AppSidebar tenantName={tenant?.name || 'Lager'} />
        <SidebarInset className="flex flex-col h-full w-full min-w-0 relative">
          <div className="h-full overflow-y-auto">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background border-b w-full">

              <div className="flex items-center gap-2 px-2 sm:px-4 flex-1 min-w-0 overflow-hidden">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
                <DynamicBreadcrumb />

              </div>
              <div className="px-2 sm:px-4 shrink-0">
              <UserButton/>
              </div>

            </header>
            <main className="p-6">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>

    </div>
  );
}
