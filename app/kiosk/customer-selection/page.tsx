"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Plus } from "lucide-react"
import { searchCustomers } from "@/lib/kiosk-actions"

interface Customer {
  _id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  phone?: string
}

function CustomerSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchCriteria, setSearchCriteria] = useState({
    phone: "",
    email: ""
  })

  useEffect(() => {
    let phone = searchParams.get('phone') || ""
    let email = searchParams.get('email') || ""
    
    // If no URL params, try to restore from sessionStorage (for back navigation)
    if (!phone && !email) {
      const storedCriteria = sessionStorage.getItem('kioskSearchCriteria')
      if (storedCriteria) {
        const criteria = JSON.parse(storedCriteria)
        phone = criteria.phone || ""
        email = criteria.email || ""
      }
    }
    
    setSearchCriteria({ phone, email })
    
    // Clear any existing kiosk transaction data from session storage
    sessionStorage.removeItem('kioskRepairs')
    sessionStorage.removeItem('kioskOffers')
    
    const performSearch = async () => {
      setIsLoading(true)
      try {
        const results = await searchCustomers({ phone, email })
        setCustomers(results)
      } catch (error) {
        console.error("Error searching customers:", error)
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [searchParams])

  const handleSelectCustomer = (customer: Customer) => {
    // Store selected customer in sessionStorage and navigate to transaction manager
    sessionStorage.setItem('selectedCustomer', JSON.stringify(customer))
    router.push('/kiosk/transaction')
  }

  const handleCreateNewCustomer = () => {
    // Pass search criteria and kiosk workflow parameters to new customer form
    const params = new URLSearchParams()
    if (searchCriteria.phone) params.set('phone', searchCriteria.phone)
    if (searchCriteria.email) params.set('email', searchCriteria.email)
    
    // Add kiosk workflow parameters
    params.set('returnTo', 'kiosk')
    params.set('selectCustomer', 'true')
    
    router.push(`/kiosk/customer-create?${params.toString()}`)
  }

  const handleBack = () => {
    router.push("/kiosk/customer-search")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Searching customers...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold">
                {customers.length > 0 ? "Select Customer" : "No Customers Found"}
              </CardTitle>
              <CardDescription>
                {customers.length > 0 
                  ? `Found ${customers.length} matching customer${customers.length > 1 ? 's' : ''}`
                  : "No existing customers match your search criteria"
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="space-y-4">
              {customers.map((customer) => (
                <Card 
                  key={customer._id} 
                  className="cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                        {customer.company && (
                          <p className="text-sm text-muted-foreground">{customer.company}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleCreateNewCustomer}
                  className="w-full h-12"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Customer Instead
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="py-8">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">
                  No customers found matching your search
                </p>
                <p className="text-sm text-muted-foreground">
                  Searched for: {[searchCriteria.phone, searchCriteria.email].filter(Boolean).join(", ")}
                </p>
              </div>
              
              <Button 
                onClick={handleCreateNewCustomer}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CustomerSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CustomerSelectionContent />
    </Suspense>
  )
}
