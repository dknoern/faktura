"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search } from "lucide-react"

export default function CustomerSearchPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: "",
    email: ""
  })
  const [isSearching, setIsSearching] = useState(false)

  // Clear form data and session storage when component mounts to ensure fresh start
  useEffect(() => {
    setFormData({
      phone: "",
      email: ""
    })
    
    // Clear any existing kiosk transaction data from session storage
    sessionStorage.removeItem('kioskRepairs')
    sessionStorage.removeItem('kioskOffers')
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validatePhone = (phone: string) => {
    // Remove all non-digit characters and check if at least 10 digits remain
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10
  }

  const validateEmail = (email: string) => {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSearch = async () => {
    if (!formData.phone && !formData.email) {
      alert("Please enter a phone number or email to search")
      return
    }

    // Validate phone number if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      alert("Phone number must contain at least 10 digits")
      return
    }

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      alert("Please enter a valid email address")
      return
    }

    setIsSearching(true)
    
    try {
      // Store search criteria in sessionStorage for navigation back scenarios
      sessionStorage.setItem('kioskSearchCriteria', JSON.stringify(formData))
      
      // Create search params for the next page
      const searchParams = new URLSearchParams()
      if (formData.phone) searchParams.set('phone', formData.phone)
      if (formData.email) searchParams.set('email', formData.email)
      
      router.push(`/kiosk/customer-selection?${searchParams.toString()}`)
    } catch (error) {
      console.error("Error during search:", error)
      alert("An error occurred during search. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleBack = () => {
    router.push("/kiosk")
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
                Customer Information
              </CardTitle>
              <CardDescription>
                Enter phone number and/or email to search for existing customers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSearch}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
                disabled={isSearching || (!formData.phone && !formData.email)}
              >
                <Search className="mr-2 h-5 w-5" />
                {isSearching ? "Searching..." : "Search Customers"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
