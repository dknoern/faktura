"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Upload, X, Save } from "lucide-react"
import { KioskCustomer, KioskRepair, KioskOffer, KioskTransaction } from "@/lib/models/kiosk-transaction"
import { submitKioskTransaction } from "@/lib/kiosk-actions"
import { SignaturePad } from "@/components/kiosk/signature-pad"

export default function CompleteTransactionPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<KioskCustomer | null>(null)
  const [repairs, setRepairs] = useState<KioskRepair[]>([])
  const [offers, setOffers] = useState<KioskOffer[]>([])
  const [images, setImages] = useState<File[]>([])
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signature, setSignature] = useState("")
  const [signatureDate, setSignatureDate] = useState<Date | null>(null)

  useEffect(() => {
    // Get data from sessionStorage
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


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).filter(file => 
        file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
      )
      setImages(prev => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSignatureChange = (sig: string) => {
    setSignature(sig)
    // Set signature date on first signature
    if (sig && !signatureDate) {
      setSignatureDate(new Date())
    }
    // Clear signature date when signature is cleared
    if (!sig) {
      setSignatureDate(null)
    }
  }

  const handleSubmit = async () => {
    if (!customer) return

    setIsSubmitting(true)

    try {
      const transaction: KioskTransaction = {
        customer,
        repairs,
        offers,
        images: [], // Will be populated with uploaded image URLs
        signature,
        signatureDate: signatureDate || undefined,
        receivedBy: "Kiosk",
        comments,
        createdAt: new Date()
      }

      const result = await submitKioskTransaction(transaction, images)
      
      if (result.success) {
        // Clear sessionStorage
        sessionStorage.removeItem('selectedCustomer')
        sessionStorage.removeItem('kioskServiceType')
        sessionStorage.removeItem('kioskRepairs')
        sessionStorage.removeItem('kioskOffers')

        // Redirect to success page
        router.push('/kiosk?success=true')
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error('Error submitting transaction:', error)
      alert('Error submitting transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push('/kiosk/transaction')
  }

  const canSubmit = customer && signature

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
            <div>
              <CardTitle className="text-2xl font-bold">
                Complete Transaction
              </CardTitle>
              <CardDescription>
                Add images and signature to finalize your transaction
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Summary</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p><strong>Customer:</strong> {customer.firstName} {customer.lastName}</p>
              <p><strong>Items:</strong> {repairs.length} repair(s), {offers.length} offer item(s)</p>
            </div>
          </div>

          <Separator />

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Images (Optional)</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement
                  input?.click()
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
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
              )}
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any additional notes or comments..."
              rows={3}
            />
          </div>

          <Separator />

          {/* E-Signature */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Customer Signature *</h3>
              <div className="space-y-2">
                <h4 className="text-base font-medium">Acknowledgment of Watch Intake</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  By signing below, I acknowledge that I am leaving my watch with Demesy & Co., LTD. for an estimate, which includes a full evaluation of the timepiece. I understand that any estimate provided is subject to final inspection and that no repairs or services will be performed without my prior authorization.
                </p>
              </div>
            </div>
            <SignaturePad 
              onSignatureChange={handleSignatureChange}
              value={signature}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              <Save className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Complete Transaction'}
            </Button>
            {!canSubmit && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Please provide a signature to complete
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
