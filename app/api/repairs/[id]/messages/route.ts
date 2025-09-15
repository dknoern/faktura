import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import { Repair } from "@/lib/models/repair"
import { getShortUser } from "@/lib/auth-utils"
import { fetchDefaultTenant } from "@/lib/data"
import { getImageHost } from "@/lib/utils/imageHost"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const { message } = await request.json()
    const { id } = await params
    
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Get the current user
    const userName = await getShortUser()
    
    // Create the new message object
    const newMessage = {
      date: new Date(),
      from: userName || "System",
      message: message.trim()
    }

    // Find the repair and add the message
    const repair = await Repair.findById(id)
    
    if (!repair) {
      return NextResponse.json(
        { error: "Repair not found" },
        { status: 404 }
      )
    }

    // Initialize messages array if it doesn't exist
    if (!repair.messages) {
      repair.messages = []
    }

    // Add the new message
    repair.messages.push(newMessage)
    
    // Save the repair
    await repair.save()

    // Send email to customer if they have an email address
    if (repair.customerEmail || repair.email) {
      const customerEmail = repair.customerEmail || repair.email
      
      try {
        // Get tenant info for company details
        const tenant = await fetchDefaultTenant()
        const imageHost = getImageHost()
        
        // Create email HTML with the message
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .logo { max-height: 60px; margin-bottom: 10px; }
              .message-box { background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
              .from { color: #6c757d; font-size: 14px; margin-bottom: 10px; }
              .message-text { font-size: 16px; white-space: pre-wrap; }
              .repair-info { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
              .footer { color: #6c757d; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                ${tenant?.logoUrl ? `<img src="${imageHost}/api/images/logo-${tenant._id}.png" alt="${tenant.name}" class="logo" />` : ''}
                <h2>New Message Regarding Your Repair</h2>
              </div>
              
              <div class="message-box">
                <div class="from">From: ${newMessage.from}</div>
                <div class="message-text">${newMessage.message}</div>
              </div>
              
              <div class="repair-info">
                <h3>Repair Details:</h3>
                <p><strong>Repair #:</strong> ${repair.repairNumber}</p>
                <p><strong>Item:</strong> ${repair.itemNumber} - ${repair.description}</p>
              </div>
              
              <div class="footer">
                <p>If you have any questions, please contact us at:</p>
                ${tenant?.phone ? `<p>Phone: ${tenant.phone}</p>` : ''}
                ${tenant?.email ? `<p>Email: ${tenant.email}</p>` : ''}
                ${tenant?.address ? `<p>${tenant.address}</p>` : ''}
              </div>
            </div>
          </body>
          </html>
        `

        // Send the email
        const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
        const emailResponse = await fetch(`${baseUrl}/api/email/send-repair-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: customerEmail,
            subject: `Update on Repair #${repair.repairNumber}`,
            html: emailHtml
          })
        })

        if (!emailResponse.ok) {
          console.error("Failed to send email notification")
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        // Don't fail the whole operation if email fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Message sent successfully"
    })
  } catch (error) {
    console.error("Error adding message to repair:", error)
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    )
  }
}
