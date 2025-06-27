import localFont from "next/font/local";
import "../globals.css";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import UserButton from "@/components/user-button";

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

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`flex h-screen flex-col md:flex-row ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full w-full min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 bg-background border-b w-full sticky top-0 z-10">

            <div className="flex items-center gap-2 px-2 sm:px-4 flex-1 min-w-0 overflow-hidden">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
              <Breadcrumb className="min-w-0 overflow-hidden">
                <BreadcrumbList className="flex-nowrap">
                  <BreadcrumbItem className="hidden sm:block">
                    <BreadcrumbLink href="#" className="truncate">
                      Inventory
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate">Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

            </div>
            <div className="px-2 sm:px-4 shrink-0">
            <UserButton/>
            </div>

          </header>
          <main className="flex-1 overflow-y-auto" style={{ height: 'calc(100% - 4rem)' }}>
            <div className="p-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>

    </div>
  );
}
