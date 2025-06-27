"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar"


export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  // Function to handle navigation and close sidebar on mobile
  const handleNavigation = (url: string) => {
    if (isMobile) {
      // Close the mobile sidebar
      setOpenMobile(false);
    }
    // Navigate to the URL
    router.push(url);
  };

  // Function to check if a menu item is active
  const isItemActive = (itemUrl: string, subItems?: { title: string; url: string }[]) => {
    // Check if current path matches the item URL
    if (pathname === itemUrl) return true;
    
    // For items with sub-items, check if any sub-item matches
    if (subItems) {
      return subItems.some(subItem => pathname === subItem.url);
    }
    
    // Check if current path starts with the item URL (for nested routes)
    return pathname.startsWith(itemUrl) && itemUrl !== '#';
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isItemActive(item.url, item.items);
          
          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  onClick={item.items?.length ? undefined : () => handleNavigation(item.url)}
                  isActive={isActive}
                >
                  {/* Use div instead of Link to handle navigation manually */}
                  <div className="cursor-pointer">
                    <item.icon />
                    <span>{item.title}</span>
                  </div>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubItemActive = pathname === subItem.url;
                          
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                onClick={() => handleNavigation(subItem.url)}
                                isActive={isSubItemActive}
                              >
                                {/* Use div instead of Link to handle navigation manually */}
                                <div className="cursor-pointer">
                                  <span>{subItem.title}</span>
                                </div>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
