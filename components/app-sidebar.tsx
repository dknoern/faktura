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
          title: "Daily Sales",
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
          title: "Monthly Sales",
          url: "/reports/monthly-sales",
        },
        {
          title: "Out at Show",
          url: "/reports/out-at-show",
        },
        {
          title: "Show Report",
          url: "/reports/show-report",
        },
        {
          title: "In Stock",
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenantName: string;
}

export function AppSidebar({ tenantName, ...props }: AppSidebarProps) {
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
                  <span className="truncate font-semibold">{tenantName}</span>
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
