"use client"

import { usePathname } from "next/navigation"
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
    { label: "Products" }
  ],
  "/repairs": [
    { label: "Repairs" }
  ],
  "/customers": [
    { label: "Customers" }
  ],
  "/invoices": [
    { label: "Invoices" }
  ],
  "/returns": [
    { label: "Returns" }
  ],
  "/logoutitems": [
    { label: "Log Out Items" }
  ],
  "/loginitems": [
    { label: "Log In Items" }
  ],
  "/reports": [
    { label: "Reports", href: "#" }

  ]
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // Get the base path (remove any sub-paths like /products/123)
  const basePath = pathname.split('/').slice(0, 2).join('/') || '/'
  
  const breadcrumbs = breadcrumbMap[basePath] || [
    { label: "Dashboard" }
  ]

  return (
    <Breadcrumb className="min-w-0 overflow-hidden">
      <BreadcrumbList className="flex-nowrap">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem className={index === 0 && breadcrumbs.length > 1 ? "hidden sm:block" : "min-w-0"}>
              {breadcrumb.href ? (
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
