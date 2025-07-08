"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "react-hot-toast"

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

interface EmailDialogProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
}

export function EmailDialog({ isOpen, onClose, proposal }: EmailDialogProps) {
  const [emails, setEmails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validateEmails = (emailString: string): string[] => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailList = emailString.split(',').map(email => email.trim()).filter(email => email)
    const invalidEmails: string[] = []
    
    emailList.forEach(email => {
      if (!emailRegex.test(email)) {
        invalidEmails.push(email)
      }
    })
    
    return invalidEmails
  }

  const handleSend = async () => {
    if (!emails.trim()) {
      setErrors(["Please enter at least one email address"])
      return
    }

    const invalidEmails = validateEmails(emails)
    if (invalidEmails.length > 0) {
      setErrors([`Invalid email format: ${invalidEmails.join(', ')}`])
      return
    }

    setErrors([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/email/send-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalId: proposal._id,
          emails: emails
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const emailCount = emails.split(',').map(e => e.trim()).filter(e => e).length
      toast.success(`Proposal sent successfully to ${emailCount} recipient${emailCount > 1 ? 's' : ''}`)
      
      // Reset form and close dialog
      setEmails("")
      setErrors([])
      onClose()
    } catch (error) {
      console.error('Error sending email:', error)
      setErrors([error instanceof Error ? error.message : 'Failed to send email'])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setEmails("")
      setErrors([])
      onClose()
    }
  }

  // Reset body style when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose()
      // Reset body style
      document.body.style.pointerEvents = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Proposal</DialogTitle>
          <DialogDescription>
            Send Proposal #{proposal._id} to one or more email addresses. 
            Separate multiple addresses with commas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <Input
              id="emails"
              placeholder="email@example.com, another@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              disabled={isLoading}
            />
            {errors.length > 0 && (
              <div className="text-sm text-red-600">
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !emails.trim()}
          >
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
