"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wrench, DollarSign, CheckCircle } from "lucide-react"

export const dynamic = 'force-dynamic';

function KioskContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Check if we're showing success message
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      // Clear the success parameter after showing
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const handleStartRequest = () => {
    // Navigate directly to customer search without storing service type
    router.push('/kiosk/customer-search')
  }

  const handleStartNew = () => {
    setShowSuccess(false)
    // Clear any existing session data
    sessionStorage.removeItem('selectedCustomer')
    sessionStorage.removeItem('kioskServiceType')
    sessionStorage.removeItem('kioskRepairs')
    sessionStorage.removeItem('kioskOffers')
  }

  if (showSuccess) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-green-700">Transaction Complete!</h1>

        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your transaction has been logged and our team will review it shortly. 
                You will be contacted if we need any additional information.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleStartNew}
              className="w-full h-12 text-lg font-semibold mt-6"
              size="lg"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="relative z-10 space-y-8 px-4 py-12">
        <div className="max-w-lg mx-auto">
          <Card className="cursor-pointer hover:shadow-md hover:bg-muted/50 bg-muted/80 transition-all duration-200"
            onClick={handleStartRequest}
          >
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Wrench className="h-6 w-6 text-primary" />
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">New Request</h2>
              <p className="text-muted-foreground">
                Submit items for repair service or purchase offer
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <KioskContent />
    </Suspense>
  )
}
