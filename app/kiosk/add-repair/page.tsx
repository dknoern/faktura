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
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import { KioskRepair } from "@/lib/models/kiosk-transaction"
import { getDiagnosticFeeText, getManufacturers, getMaterials, getRepairDurationText } from "@/lib/utils/ref-data"
import { compressImages } from "@/lib/image-utils"

export default function AddRepairPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    brand: "",
    material: "",
    description: "",
    itemValue: "",
    repairOptions: {
      service: false,
      polish: false,
      batteryChange: false,
      other: false
    },
    additionalDetails: ""
  })
  const [images, setImages] = useState<File[]>([])
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([])
  const [isCompressing, setIsCompressing] = useState(false)

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setIsCompressing(true)
      try {
        const imageFiles = Array.from(files).filter(file =>
          file.type.startsWith('image/')
        )

        // Compress images to max 500KB each
        const compressedImages = await compressImages(imageFiles, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          maxSizeKB: 500
        })

        // Convert compressed images to base64 data URLs
        const dataUrls = await Promise.all(
          compressedImages.map(file => {
            return new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
          })
        )

        setImages(prev => [...prev, ...compressedImages])
        setImageDataUrls(prev => [...prev, ...dataUrls])
      } catch (error) {
        console.error('Error compressing images:', error)
        alert('Error processing images. Please try again.')
      } finally {
        setIsCompressing(false)
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageDataUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    // Create repair item with unique ID
    const repairItem: KioskRepair = {
      id: `repair-${Date.now()}`,
      brand: formData.brand,
      material: formData.material,
      description: formData.description,
      itemValue: formData.itemValue,
      repairOptions: formData.repairOptions,
      additionalDetails: formData.additionalDetails,
      images: imageDataUrls.length > 0 ? imageDataUrls : undefined
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
                Enter details about the watch you would like to have repaired.
                <p className="text-xs text-muted-foreground mt-2">{getDiagnosticFeeText()}</p>
                <p className="text-xs text-muted-foreground mt-2">{getRepairDurationText()}</p>
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
                <Label htmlFor="referenceNumber">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter description of item"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemValue">Value of Item</Label>
                <Input
                  id="itemValue"
                  value={formData.itemValue}
                  onChange={(e) => handleInputChange("itemValue", e.target.value)}
                  placeholder="Enter value of item, e.g. $5000"
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
              <Label htmlFor="additionalDetails">Additional Details</Label>
              <Textarea
                id="additionalDetails"
                value={formData.additionalDetails}
                onChange={(e) => handleInputChange("additionalDetails", e.target.value)}
                placeholder="Describe any specific issues or additional details..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Image Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload Images</h3>
              <p className="text-sm text-muted-foreground">
                Add photos of your watch to help with the repair assessment
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1"
                    disabled={isCompressing}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[type="file"]') as HTMLInputElement
                      input?.click()
                    }}
                    disabled={isCompressing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isCompressing ? 'Processing...' : 'Add Images'}
                  </Button>
                </div>

                {isCompressing && (
                  <div className="text-sm text-muted-foreground">
                    Compressing images for upload...
                  </div>
                )}

                {images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {images.length} image(s) ready for upload (compressed to ~500KB each)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imageDataUrls.map((dataUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={dataUrl}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {images[index] ? Math.round(images[index].size / 1024) : '~500'}KB
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
