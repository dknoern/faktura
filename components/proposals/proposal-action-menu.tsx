"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Printer, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { EmailDialog } from "./email-dialog"


interface ProposalLineItem {
  name: string
  longDesc: string
  amount: number
}

interface Proposal {
  _id: number
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

  const handlePrint = () => {
    // Create hidden iframe for printing
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '1px'
    iframe.style.height = '1px'
    
    document.body.appendChild(iframe)
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print()
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      } catch (error) {
        console.error('Print failed, falling back to new tab:', error)
        // Fallback to new tab
        window.open(`/proposals/${proposal._id}/print`, '_blank')
        document.body.removeChild(iframe)
      }
    }
    
    iframe.src = `/proposals/${proposal._id}/print`
  }

  const handleEmail = () => {
    setIsEmailDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
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
