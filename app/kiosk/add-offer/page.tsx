"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"
import { KioskOffer } from "@/lib/models/kiosk-transaction"
import { getCondition, getManufacturers, getMaterials } from "@/lib/utils/ref-data"

export default function AddOfferPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    material: "",
    condition: "",
    yearPurchased: "",
    originalPrice: "",
    description: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    // Create offer item with unique ID
    const offerItem: KioskOffer = {
      id: `offer-${Date.now()}`,
      brand: formData.brand,
      model: formData.model,
      material: formData.material,
      condition: formData.condition,
      description: formData.description
    }

    // Get existing offers from sessionStorage
    const existingOffers = JSON.parse(sessionStorage.getItem('kioskOffers') || '[]')
    existingOffers.push(offerItem)
    sessionStorage.setItem('kioskOffers', JSON.stringify(existingOffers))

    // Return to transaction page
    router.push('/kiosk/transaction')
  }

  const handleBack = () => {
    router.push('/kiosk/transaction')
  }

  const canSave = formData.brand && formData.model && formData.condition

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
                Add Item for Sale
              </CardTitle>
              <CardDescription>
                Enter details about the item you would like to sell
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Item Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {getManufacturers().map((manufacturer) => (
                      <SelectItem key={manufacturer.value} value={manufacturer.value}>
                        {manufacturer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  placeholder="Enter model name or number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select value={formData.material} onValueChange={(value) => handleInputChange("material", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    { getMaterials().map(material => (
                      <SelectItem key={material.value} value={material.value}>
                        {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCondition().map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Additional Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Additional Details</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe any special features, accessories included, or other relevant details..."
                rows={3}
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button 
                onClick={handleSave}
                disabled={!canSave}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                Add Item for Sale
              </Button>
              {!canSave && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Please select brand, model, and condition to continue
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
