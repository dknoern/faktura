"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"
import { KioskRepair } from "@/lib/models/kiosk-transaction"
import { getManufacturers, getMaterials } from "@/lib/utils/ref-data"

export default function AddRepairPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    brand: "",
    material: "",
    referenceNumber: "",
    repairOptions: {
      service: false,
      polish: false,
      batteryChange: false,
      other: false
    },
    description: ""
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRepairOptionChange = (option: keyof typeof formData.repairOptions, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      repairOptions: {
        ...prev.repairOptions,
        [option]: checked
      }
    }))
  }

  const handleSave = () => {
    // Create repair item with unique ID
    const repairItem: KioskRepair = {
      id: `repair-${Date.now()}`,
      brand: formData.brand,
      material: formData.material,
      referenceNumber: formData.referenceNumber,
      repairOptions: formData.repairOptions,
      description: formData.description
    }

    // Get existing repairs from sessionStorage
    const existingRepairs = JSON.parse(sessionStorage.getItem('kioskRepairs') || '[]')
    existingRepairs.push(repairItem)
    sessionStorage.setItem('kioskRepairs', JSON.stringify(existingRepairs))

    // Return to transaction page
    router.push('/kiosk/transaction')
  }

  const handleBack = () => {
    router.push('/kiosk/transaction')
  }

  const canSave = formData.brand && formData.material

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
                Add Repair Item
              </CardTitle>
              <CardDescription>
                Enter details about the watch you would like to have repaired
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
                <Label htmlFor="material">Material *</Label>
                <Select value={formData.material} onValueChange={(value) => handleInputChange("material", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMaterials().map((material) => (
                      <SelectItem key={material.value} value={material.value}>
                        {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
                  placeholder="Enter reference number if known"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-medium">Repair Services Needed</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="service"
                    checked={formData.repairOptions.service}
                    onCheckedChange={(checked) => handleRepairOptionChange("service", checked as boolean)}
                  />
                  <Label htmlFor="service">Service</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="polish"
                    checked={formData.repairOptions.polish}
                    onCheckedChange={(checked) => handleRepairOptionChange("polish", checked as boolean)}
                  />
                  <Label htmlFor="polish">Polish</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batteryChange"
                    checked={formData.repairOptions.batteryChange}
                    onCheckedChange={(checked) => handleRepairOptionChange("batteryChange", checked as boolean)}
                  />
                  <Label htmlFor="batteryChange">Battery Change</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="other"
                    checked={formData.repairOptions.other}
                    onCheckedChange={(checked) => handleRepairOptionChange("other", checked as boolean)}
                  />
                  <Label htmlFor="other">Other</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="description">Additional Details</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe any specific issues or additional details..."
                rows={3}
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSave}
                disabled={!canSave}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                Add Repair Item
              </Button>
              {!canSave && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Please select brand and material to continue
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
