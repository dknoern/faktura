"use client"

import * as React from "react"
import {
  ShoppingCart,
  Package,
  Users,
  FileText,
  Repeat2,
  Wrench,
  SquarePen,
  SquareArrowOutUpRight,
  ChartColumn,
  Home,
  Gift,
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
import { BRAND_CONFIG } from "@/lib/constants"

const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: Home,
    },
    {
      title: "Products",
      url: "/products",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: FileText,
    },

    {
      title: "Returns",
      url: "/returns",
      icon: Repeat2,
    },
    {
      title: "Repairs",
      url: "/repairs",
      icon: Wrench,
    },
    {
      title: "Wanted",
      url: "/wanted",
      icon: Gift,
    },
    {
      title: "Log In Items",
      url: "/loginitems",
      icon: SquarePen,
    },
    {
      title: "Log Out Items",
      url: "/logoutitems",
      icon: SquareArrowOutUpRight,
    },
    {
      title: "Reports",
      url: "#",
      icon: ChartColumn,
      items: [
        {
          title: "Repairs",
          url: "/reports/outstanding-repairs",
        },
        {
          title: "Memo Items",
          url: "/reports/items-on-memo",
        },
        {
          title: "Daily sales",
          url: "/reports/daily-sales",
        },
        {
          title: "Returns",
          url: "/reports/returns-summary",
        },
        {
          title: "Partnership",
          url: "/reports/partnership-items",
        },
        {
          title: "Consignment",
          url: "/reports/consignment-items",
        },
        {
          title: "Monthly sales",
          url: "/reports/monthly-sales",
        },
        {
          title: "Out at Show",
          url: "/reports/out-at-show",
        },
        {
          title: "Show report",
          url: "/reports/show-report",
        },
        {
          title: "In stock",
          url: "/reports/in-stock",
        },
        {
          title: "Customers",
          url: "/reports/customers",
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
              <a href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent">
                  <Package className="size-6" style={{ color: BRAND_CONFIG.colors.primary }} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{BRAND_CONFIG.name}</span>
                  <span className="truncate text-xs">{BRAND_CONFIG.tagline}</span>
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
