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
          url: "/dashboard/reports/daily-sales",
        },
        {
          title: "Returns summary",
          url: "/dashboard/reports/returns-summary",
        },
        {
          title: "Partnership items",
          url: "/dashboard/reports/partnership-items",
        },
        {
          title: "Consignment items",
          url: "/dashboard/reports/consignment-items",
        },
        {
          title: "Monthly sales",
          url: "/dashboard/reports/monthly-sales",
        },
        {
          title: "Out at show",
          url: "/dashboard/reports/out-at-show",
        },
        {
          title: "Show report",
          url: "/dashboard/reports/show-report",
        },
        {
          title: "In stock",
          url: "/dashboard/reports/in-stock",
        },
        {
          title: "Customers",
          url: "/dashboard/reports/customers",
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
