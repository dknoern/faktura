import { NextRequest, NextResponse } from "next/server"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import { fetchDefaultTenant } from "@/lib/data"


// Configure AWS SES
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, repairId } = await request.json()

    if (!to || !subject || !html || !repairId) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html, repairId" },
        { status: 400 }
      )
    }

    const tenant = await fetchDefaultTenant()
    const emailDomain = tenant!.repairEmail!.split('@')[1]
    const sourceEmail = `${tenant!.nameLong} <repairs@${emailDomain}>`
    const replyToEmail = `repairs+${repairId}@${emailDomain}`

    const command = new SendEmailCommand({
      Source: sourceEmail,
      ReplyToAddresses: [replyToEmail],
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    })

    await sesClient.send(command)

    return NextResponse.json({ 
      success: true,
      message: "Email sent successfully"
    })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
