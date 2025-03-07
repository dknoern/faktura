"use client"

import * as React from "react"
import {
  ShoppingCart,
  Watch,
  Users,
  FileText,
  Repeat2,
  Wrench,
  SquarePen,
  SquareArrowOutUpRight,
  ChartColumn,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"

const data = {
  navMain: [
    {
      title: "Products",
      url: "/dashboard/products",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "Invoices",
      url: "/dashboard/invoices",
      icon: FileText,
    },

    {
      title: "Returns",
      url: "/dashboard/returns",
      icon: Repeat2,
    },
    {
      title: "Repairs",
      url: "/dashboard/repairs",
      icon: Wrench,
    },
    {
      title: "Log In Items",
      url: "/dashboard/loginitems",
      icon: SquarePen,
    },
    {
      title: "Log Out Items",
      url: "/dashboard/logoutitems",
      icon: SquareArrowOutUpRight,
    },
    {
      title: "Reports",
      url: "#",
      icon: ChartColumn,
      items: [
        {
          title: "Outstanding repairs",
          url: "/dashboard/reports/outstanding-repairs",
        },
        {
          title: "Items on memo",
          url: "/dashboard/reports/items-on-memo",
        },
        {
          title: "Daily sales",
          url: "#",
        },
        {
          title: "Returns summary",
          url: "#",
        },
        {
          title: "Partnership items",
          url: "#",
        },
        {
          title: "Consignment items",
          url: "#",
        },
        {
          title: "Monthly sales",
          url: "#",
        },
        {
          title: "Out at show",
          url: "#",
        },
        {
          title: "Show report",
          url: "#",
        },
        {
          title: "In stock",
          url: "#",
        },
        {
          title: "Customers",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Watch className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Lager</span>
                  <span className="truncate text-xs">Inventory</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}
