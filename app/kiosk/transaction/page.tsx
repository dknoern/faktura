"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Wrench, DollarSign, User, CheckCircle } from "lucide-react"
import { KioskCustomer, KioskRepair, KioskOffer } from "@/lib/models/kiosk-transaction"

export default function KioskTransactionPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<KioskCustomer | null>(null)
  const [repairs, setRepairs] = useState<KioskRepair[]>([])
  const [offers, setOffers] = useState<KioskOffer[]>([])

  useEffect(() => {
    // Get customer and items from sessionStorage
    const selectedCustomer = sessionStorage.getItem('selectedCustomer')
    const kioskRepairs = sessionStorage.getItem('kioskRepairs')
    const kioskOffers = sessionStorage.getItem('kioskOffers')
    
    if (selectedCustomer) {
      setCustomer(JSON.parse(selectedCustomer))
    }
    
    if (kioskRepairs) {
      setRepairs(JSON.parse(kioskRepairs))
    }
    
    if (kioskOffers) {
      setOffers(JSON.parse(kioskOffers))
    }
    
    if (!selectedCustomer) {
      router.push('/kiosk')
    }
  }, [router])

  const handleAddRepair = () => {
    router.push('/kiosk/add-repair')
  }

  const handleAddOffer = () => {
    router.push('/kiosk/add-offer')
  }

  const handleComplete = () => {
    router.push('/kiosk/complete-transaction')
  }

  const handleBack = () => {
    router.push('/kiosk/customer-selection')
  }

  const canComplete = repairs.length > 0 || offers.length > 0

  if (!customer) {
    return (
      <div className="space-y-6">
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading...</p>
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
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">
                Request Manager
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  {customer.firstName} {customer.lastName} ({customer.email})
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Items</h3>
              <div className="flex gap-2">
                <Button onClick={handleAddRepair} size="sm" variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Add Repair
                </Button>
                <Button onClick={handleAddOffer} size="sm" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Offer Item
                </Button>
              </div>
            </div>
          </div>

          {/* Repairs Section */}
          {repairs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Repair Items ({repairs.length})</h3>
              <div className="space-y-3">
                {repairs.map((repair, index) => (
                  <Card key={repair.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{repair.brand} Watch</h4>
                          <p className="text-sm text-muted-foreground">{repair.material}</p>
                          {repair.referenceNumber && (
                            <p className="text-xs text-muted-foreground">Ref: {repair.referenceNumber}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Wrench className="h-3 w-3 mr-1" />
                          Repair #{index + 1}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Offers Section */}
          {offers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Items for Sale ({offers.length})</h3>
              <div className="space-y-3">
                {offers.map((offer, index) => (
                  <Card key={offer.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{offer.brand} {offer.model}</h4>
                          <p className="text-sm text-muted-foreground">{offer.material}</p>
                          <p className="text-sm text-muted-foreground">Condition: {offer.condition}</p>
                          {offer.yearPurchased && (
                            <p className="text-xs text-muted-foreground">Year: {offer.yearPurchased}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Sale #{index + 1}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {repairs.length === 0 && offers.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <div className="flex justify-center gap-4 mb-4">
                  <Wrench className="h-8 w-8 opacity-50" />
                  <DollarSign className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-lg mb-2">No items added yet</p>
                <p className="text-sm">Add repair items or sale items to get started</p>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Complete Transaction */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Complete Request</h3>
            <p className="text-sm text-muted-foreground">
              Add images and complete your signature to finish the transaction.
            </p>
            <Button 
              onClick={handleComplete}
              disabled={!canComplete}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Complete Request
            </Button>
            {!canComplete && (
              <p className="text-xs text-muted-foreground text-center">
                Add at least one item to complete the transaction
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
