"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  Wrench, 
  FileText,
  Clock,
  CheckCircle,
  Package,
  Edit
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface RepairDetails {
  _id: string
  repairNumber: string
  itemNumber: string
  description: string
  dateOut: string | null
  customerApprovedDate: string | null
  returnDate: string | null
  customerFirstName: string
  customerLastName: string
  customerEmail?: string
  customerPhone?: string
  vendor: string
  repairCost: number
  repairIssues?: string
  repairNotes?: string
  customerId?: string
}

interface RepairDetailsModalProps {
  repairId: string | null
  isOpen: boolean
  onClose: () => void
}

export function RepairDetailsModal({ repairId, isOpen, onClose }: RepairDetailsModalProps) {
  const router = useRouter()
  const [repair, setRepair] = useState<RepairDetails | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (repairId && isOpen) {
      fetchRepairDetails()
      fetchRepairImages()
    }
  }, [repairId, isOpen])

  const fetchRepairDetails = async () => {
    if (!repairId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/repairs/${repairId}`)
      if (response.ok) {
        const data = await response.json()
        setRepair(data)
      }
    } catch (error) {
      console.error("Error fetching repair details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRepairImages = async () => {
    if (!repairId) return
    
    try {
      const response = await fetch(`/api/repairs/${repairId}/images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0])
        }
      }
    } catch (error) {
      console.error("Error fetching repair images:", error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value)
  }

  const handleEdit = () => {
    if (repair) {
      router.push(`/repairs/${repair._id}/edit`)
      onClose()
    }
  }

  const getStatusBadge = () => {
    if (!repair) return null
    
    if (repair.returnDate) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    } else if (repair.customerApprovedDate) {
      return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>
    } else if (repair.vendor) {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-semibold">
                Repair #{repair?.repairNumber || "..."}
              </DialogTitle>
              {getStatusBadge()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : repair ? (
              <div className="space-y-6">
                {/* Image Gallery */}
                {images.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-3">Images</h3>
                      <div className="space-y-3">
                        {/* Main Image Display */}
                        {selectedImage && (
                          <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={selectedImage}
                              alt="Repair image"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        
                        {/* Thumbnail Gallery */}
                        {images.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((image, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImage(image)}
                                className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                                  selectedImage === image 
                                    ? "border-blue-500 ring-2 ring-blue-200" 
                                    : "border-gray-200 hover:border-gray-400"
                                }`}
                              >
                                <Image
                                  src={image}
                                  alt={`Thumbnail ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer Information */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">
                          {repair.customerFirstName} {repair.customerLastName}
                        </span>
                      </div>
                      {repair.customerEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{repair.customerEmail}</span>
                        </div>
                      )}
                      {repair.customerPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{repair.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Item Details */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Item Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Item Number:</span>
                          <p className="font-medium">{repair.itemNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Description:</span>
                          <p className="font-medium">{repair.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Repair Information */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Repair Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Vendor:</span>
                          <span className="font-medium">{repair.vendor || "Not assigned"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-medium">{formatCurrency(repair.repairCost)}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Date Out:</span>
                          <span className="font-medium">{formatDate(repair.dateOut)}</span>
                        </div>
                        {repair.customerApprovedDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Approved:</span>
                            <span className="font-medium">{formatDate(repair.customerApprovedDate)}</span>
                          </div>
                        )}
                        {repair.returnDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Returned:</span>
                            <span className="font-medium">{formatDate(repair.returnDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes and Issues */}
                {(repair.repairIssues || repair.repairNotes) && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-3">Additional Information</h3>
                      <div className="space-y-3">
                        {repair.repairIssues && (
                          <div>
                            <span className="text-sm text-muted-foreground">Issues:</span>
                            <p className="mt-1 text-sm">{repair.repairIssues}</p>
                          </div>
                        )}
                        {repair.repairNotes && (
                          <div>
                            <span className="text-sm text-muted-foreground">Notes:</span>
                            <p className="mt-1 text-sm">{repair.repairNotes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No repair details available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
