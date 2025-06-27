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
    { label: "Inventory", href: "#" },
    { label: "Dashboard" }
  ],
  "/products": [
    { label: "Inventory", href: "#" },
    { label: "Products" }
  ],
  "/repairs": [
    { label: "Inventory", href: "#" },
    { label: "Repairs" }
  ],
  "/customers": [
    { label: "Inventory", href: "#" },
    { label: "Customers" }
  ],
  "/invoices": [
    { label: "Inventory", href: "#" },
    { label: "Invoices" }
  ],
  "/returns": [
    { label: "Inventory", href: "#" },
    { label: "Returns" }
  ],
  "/logoutitems": [
    { label: "Inventory", href: "#" },
    { label: "Outs" }
  ],
  "/loginitems": [
    { label: "Inventory", href: "#" },
    { label: "Logs" }
  ]
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // Get the base path (remove any sub-paths like /products/123)
  const basePath = pathname.split('/').slice(0, 2).join('/') || '/'
  
  const breadcrumbs = breadcrumbMap[basePath] || [
    { label: "Inventory", href: "#" },
    { label: "Dashboard" }
  ]

  return (
    <Breadcrumb className="min-w-0 overflow-hidden">
      <BreadcrumbList className="flex-nowrap">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator className="hidden sm:block mr-2" />}
            <BreadcrumbItem className={index === 0 ? "hidden sm:block" : "min-w-0"}>
              {breadcrumb.href ? (
                <BreadcrumbLink href={breadcrumb.href} className="truncate">
                  {breadcrumb.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">{breadcrumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
