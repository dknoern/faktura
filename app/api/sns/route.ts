import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { simpleParser } from 'mailparser';
import { fetchRepairById } from '@/lib/data';
import { Repair } from '@/lib/models/repair';
import dbConnect from '@/lib/dbConnect';

// AWS S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// SNS message types
interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL?: string;
  SubscribeURL?: string;
  Token?: string;
}

// SES notification message structure
interface SESNotification {
  eventType: string;
  mail: {
    timestamp: string;
    source: string;
    messageId: string;
    destination: string[];
    headersTruncated: boolean;
    headers: Array<{ name: string; value: string }>;
    commonHeaders: {
      from: string[];
      to: string[];
      messageId: string;
      subject: string;
    };
  };
  receipt?: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    spamVerdict: { status: string };
    virusVerdict: { status: string };
    spfVerdict: { status: string };
    dkimVerdict: { status: string };
    dmarcVerdict: { status: string };
    action: {
      type: string;
      topicArn?: string;
      bucketName?: string;
      objectKey?: string;
    };
  };
}

// Function to validate SNS signature
async function validateSNSSignature(message: SNSMessage): Promise<boolean> {
  try {
    // Download the certificate
    const certResponse = await fetch(message.SigningCertURL);
    if (!certResponse.ok) {
      console.error('Failed to download SNS certificate');
      return false;
    }
    
    const certPem = await certResponse.text();
    
    // Create the string to sign based on SNS message type
    let stringToSign = '';
    
    if (message.Type === 'Notification') {
      stringToSign = [
        'Message', message.Message,
        'MessageId', message.MessageId,
        'Subject', message.Subject || '',
        'Timestamp', message.Timestamp,
        'TopicArn', message.TopicArn,
        'Type', message.Type
      ].join('\n') + '\n';
    } else if (message.Type === 'SubscriptionConfirmation' || message.Type === 'UnsubscribeConfirmation') {
      stringToSign = [
        'Message', message.Message,
        'MessageId', message.MessageId,
        'SubscribeURL', message.SubscribeURL || '',
        'Timestamp', message.Timestamp,
        'Token', message.Token || '',
        'TopicArn', message.TopicArn,
        'Type', message.Type
      ].join('\n') + '\n';
    }
    
    // Verify the signature
    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(stringToSign, 'utf8');
    
    const isValid = verifier.verify(certPem, message.Signature, 'base64');
    return isValid;
    
  } catch (error) {
    console.error('Error validating SNS signature:', error);
    return false;
  }
}

// Function to retrieve email from S3
async function getEmailFromS3(bucketName: string, objectKey: string): Promise<string | null> {
  try {
    console.log(`Retrieving email from S3: ${bucketName}/${objectKey}`);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.error('No body found in S3 object');
      return null;
    }
    
    // Convert stream to string
    const emailContent = await response.Body.transformToString();
    console.log('Email content retrieved from S3, length:', emailContent.length);
    
    return emailContent;
  } catch (error) {
    console.error('Error retrieving email from S3:', error);
    return null;
  }
}

// Function to parse repair ID from email address
function parseRepairIdFromEmail(emailAddress: string): string | null {
  try {
    // Look for pattern: repairs+{repairId}@domain.com
    const match = emailAddress.match(/repairs\+([^@]+)@/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error parsing repair ID from email:', error);
    return null;
  }
}

// Function to add message to repair
async function addMessageToRepair(repairId: string, fromEmail: string, messageContent: string): Promise<boolean> {
  try {
    await dbConnect();
    
    const result = await Repair.findByIdAndUpdate(
      repairId,
      {
        $push: {
          messages: {
            date: new Date(),
            from: fromEmail,
            message: messageContent
          }
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log(`Message added to repair ${repairId} successfully`);
      return true;
    } else {
      console.log(`Repair ${repairId} not found`);
      return false;
    }
  } catch (error) {
    console.error('Error adding message to repair:', error);
    return false;
  }
}

// Function to extract new content from email reply (removes quoted history)
function extractNewEmailContent(emailText: string): string {
  // Common patterns that indicate start of quoted/forwarded content
  const quotedContentPatterns = [
    // Gmail style: "On [date] at [time] [sender] wrote:"
    /On\s+.+?wrote:\s*$/im,
    // Outlook style: "From: [sender]" or "-----Original Message-----"
    /^-+\s*Original Message\s*-+/im,
    /^From:\s*.+$/im,
    // Generic patterns
    /^>\s/m, // Lines starting with >
    /^On\s+\d+\/\d+\/\d+.+?wrote:?\s*$/im, // Date-based patterns
    /^\s*[-_=]{3,}\s*$/m, // Lines with multiple dashes/underscores
    // Apple Mail style
    /^Begin forwarded message:/im,
    // Thunderbird style
    /^-------- Original Message --------/im,
  ];

  let cleanContent = emailText.trim();
  
  // Try each pattern to find where quoted content starts
  for (const pattern of quotedContentPatterns) {
    const match = cleanContent.match(pattern);
    if (match && match.index !== undefined) {
      // Take everything before the quoted content
      cleanContent = cleanContent.substring(0, match.index).trim();
      break;
    }
  }
  
  // Additional cleanup: remove common reply artifacts
  cleanContent = cleanContent
    // Remove lines that are just quotes (>) 
    .replace(/^>\s*$/gm, '')
    // Remove excessive whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
  
  return cleanContent;
}

// Function to parse email and extract text body
async function parseEmailContent(emailContent: string): Promise<string | null> {
  try {
    console.log('Parsing email content...');
    
    const parsed = await simpleParser(emailContent);
    
    // Extract text body
    let textBody = '';
    
    if (parsed.text) {
      textBody = parsed.text;
      console.log('Text body found, length:', textBody.length);
    } else if (parsed.html) {
      // If no text body, try to extract from HTML
      textBody = parsed.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      console.log('HTML body converted to text, length:', textBody.length);
    }
    
    if (textBody) {
      // Extract just the new content (remove quoted history)
      const newContent = extractNewEmailContent(textBody);
      
      console.log('Full email text body:', textBody.substring(0, 500) + (textBody.length > 500 ? '...' : ''));
      console.log('New content only:', newContent.substring(0, 500) + (newContent.length > 500 ? '...' : ''));
      
      return newContent || textBody; // Fallback to full content if extraction fails
    } else {
      console.log('No text content found in email');
      return null;
    }
  } catch (error) {
    console.error('Error parsing email content:', error);
    return null;
  }
}

// Function to process SES notification
async function processSESNotification(sesNotification: SESNotification): Promise<void> {
  try {
    console.log('Processing SES notification:', sesNotification.eventType);
    console.log('Email subject:', sesNotification.mail.commonHeaders.subject);
    console.log('From:', sesNotification.mail.commonHeaders.from);
    console.log('To:', sesNotification.mail.commonHeaders.to);
    
    // Check if this is a receipt with S3 action
    if (sesNotification.receipt?.action?.type === 'S3' && 
        sesNotification.receipt.action.bucketName && 
        sesNotification.receipt.action.objectKey) {
      
      const bucketName = sesNotification.receipt.action.bucketName;
      const objectKey = sesNotification.receipt.action.objectKey;
      
      console.log(`Email stored in S3: ${bucketName}/${objectKey}`);
      
      // Parse repair ID from To addresses
      let repairId: string | null = null;
      const toAddresses = sesNotification.mail.commonHeaders.to || [];
      
      for (const toAddress of toAddresses) {
        repairId = parseRepairIdFromEmail(toAddress);
        if (repairId) {
          console.log(`Found repair ID: ${repairId} from address: ${toAddress}`);
          break;
        }
      }
      
      if (!repairId) {
        console.log('No repair ID found in To addresses, ignoring email');
        return;
      }
      
      // Check if repair exists in database
      const repair = await fetchRepairById(repairId);
      if (!repair) {
        console.log(`Repair ${repairId} not found in database, ignoring email`);
        return;
      }
      
      console.log(`Repair ${repairId} found, processing email content`);
      
      // Retrieve email content from S3
      const emailContent = await getEmailFromS3(bucketName, objectKey);
      
      if (emailContent) {
        // Parse email and extract text body
        const textBody = await parseEmailContent(emailContent);
        
        if (textBody) {
          console.log('=== EMAIL TEXT BODY ===');
          console.log(textBody);
          console.log('=== END EMAIL TEXT BODY ===');
          
          // Get sender email address
          const fromEmail = sesNotification.mail.commonHeaders.from?.[0] || 'Unknown';
          
          // Add message to repair
          const success = await addMessageToRepair(repairId, fromEmail, textBody);
          
          if (success) {
            console.log(`Successfully added message to repair ${repairId}`);
          } else {
            console.log(`Failed to add message to repair ${repairId}`);
          }
        }
      }
    } else {
      console.log('No S3 action found in SES notification');
    }
  } catch (error) {
    console.error('Error processing SES notification:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body
    const rawBody = await request.text();
    console.log('SNS Raw Body:', rawBody);
    
    // Parse the JSON message
    const message: SNSMessage = JSON.parse(rawBody);
    console.log('SNS Message:', JSON.stringify(message, null, 2));
    
    // Validate the SNS signature
    const isValidSignature = await validateSNSSignature(message);
    
    if (!isValidSignature) {
      console.error('Invalid SNS signature');
      return NextResponse.json(
        { error: 'Invalid SNS signature' },
        { status: 401 }
      );
    }
    
    console.log('SNS signature validated successfully');
    
    // Handle different SNS message types
    switch (message.Type) {
      case 'SubscriptionConfirmation':
        console.log('SNS Subscription Confirmation received');
        console.log('SubscribeURL:', message.SubscribeURL);
        
        // Auto-confirm subscription by calling the SubscribeURL
        if (message.SubscribeURL) {
          try {
            const confirmResponse = await fetch(message.SubscribeURL);
            console.log('Subscription confirmation response:', confirmResponse.status);
          } catch (error) {
            console.error('Error confirming subscription:', error);
          }
        }
        break;
        
      case 'Notification':
        console.log('SNS Notification received');
        console.log('Subject:', message.Subject);
        console.log('Message:', message.Message);
        
        try {
          // Parse the message content (should be SES notification JSON)
          const sesNotification: SESNotification = JSON.parse(message.Message);
          
          // Process the SES notification to extract email content
          await processSESNotification(sesNotification);
          
        } catch (parseError) {
          console.error('Error parsing SES notification:', parseError);
          console.log('Raw message content:', message.Message);
        }
        break;
        
      case 'UnsubscribeConfirmation':
        console.log('SNS Unsubscribe Confirmation received');
        break;
        
      default:
        console.log('Unknown SNS message type:', message.Type);
    }
    
    // Return success response
    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('Error processing SNS message:', error);
    return NextResponse.json(
      { error: 'Error processing SNS message' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for health checks)
export async function GET() {
  return NextResponse.json({ status: 'SNS endpoint is active' });
}
