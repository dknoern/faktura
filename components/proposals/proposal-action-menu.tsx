"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Edit, Printer, Mail, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { EmailDialog } from "./email-dialog"
import { toast } from "react-hot-toast"

interface ProposalLineItem {
  name: string
  longDesc: string
  amount: number
}

interface Proposal {
  _id: string
  customerId: string
  customerFirstName: string
  customerLastName: string
  date: string
  total: number
  lineItems: ProposalLineItem[]
  status?: string
}

interface ProposalActionMenuProps {
  proposal: Proposal
}

export function ProposalActionMenu({ proposal }: ProposalActionMenuProps) {
  const router = useRouter()
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)

  const handleEdit = () => {
    router.push(`/proposals/${proposal._id}/edit`)
  }

  const handleDownload = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' })

      const response = await fetch(`/api/proposals/${proposal._id}/pdf`)
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Proposal-${proposal.customerLastName}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully', { id: 'pdf-download' })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF', { id: 'pdf-download' })
    }
  }

  const handlePrint = async () => {
    try {
      toast.loading('Preparing to print...', { id: 'pdf-print' })

      const response = await fetch(`/api/proposals/${proposal._id}/pdf`)
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Use a hidden iframe to trigger print without opening a new tab
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      iframe.style.top = '-9999px'
      document.body.appendChild(iframe)

      iframe.src = url
      iframe.onload = () => {
        toast.dismiss('pdf-print')
        // Small delay to ensure the PDF is fully rendered in the iframe
        setTimeout(() => {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        }, 500)
        // Clean up after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 60000)
      }
    } catch (error) {
      console.error('Error printing PDF:', error)
      toast.error('Failed to print PDF', { id: 'pdf-print' })
    }
  }

  const handleEmail = () => {
    setIsEmailDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Action
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmailDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        proposal={proposal}
      />
    </>
  )
}
