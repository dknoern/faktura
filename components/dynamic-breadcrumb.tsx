"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const breadcrumbMap: Record<string, { label: string; href?: string }[]> = {
  "/": [
    { label: "Dashboard" }
  ],
  "/products": [
    { label: "Products", href: "/products" }
  ],
  "/repairs": [
    { label: "Repairs", href: "/repairs" }
  ],
  "/customers": [
    { label: "Customers", href: "/customers" }
  ],
  "/invoices": [
    { label: "Invoices", href: "/invoices" }
  ],
  "/returns": [
    { label: "Returns", href: "/returns" }
  ],
  "/logoutitems": [
    { label: "Log Out Items", href: "/logoutitems" }
  ],
  "/loginitems": [
    { label: "Log In Items", href: "/loginitems" }
  ],
  "/reports": [
    { label: "Reports", href: "#" }
  ]
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Prevent hydration mismatch by showing default until mounted
  if (!mounted) {
    return (
      <Breadcrumb className="min-w-0 overflow-hidden">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate text-lg font-bold">Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }
  
  // Get the base path (remove any sub-paths like /products/123)
  const basePath = pathname.split('/').slice(0, 2).join('/') || '/'
  
  // Check if we're on a deeper page (like /products/123/view)
  const isDeepPage = pathname.split('/').length > 2
  
  const breadcrumbs = breadcrumbMap[basePath] || [
    { label: "Dashboard" }
  ]

  return (
    <Breadcrumb className="min-w-0 overflow-hidden">
      <BreadcrumbList className="flex-nowrap">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem className={index === 0 && breadcrumbs.length > 1 ? "hidden sm:block" : "min-w-0"}>
              {(breadcrumb.href && isDeepPage) || (breadcrumb.href && !isDeepPage) ? (
                <BreadcrumbLink href={breadcrumb.href} className="truncate text-lg font-bold">
                  {breadcrumb.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate text-lg font-bold">{breadcrumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && breadcrumbs.length > 1 && <BreadcrumbSeparator className="hidden sm:block mr-2" />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
