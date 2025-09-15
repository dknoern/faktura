import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { simpleParser } from 'mailparser';

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
      console.log('Email text body:', textBody.substring(0, 500) + (textBody.length > 500 ? '...' : ''));
      return textBody;
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
      
      // Retrieve email content from S3
      const emailContent = await getEmailFromS3(bucketName, objectKey);
      
      if (emailContent) {
        // Parse email and extract text body
        const textBody = await parseEmailContent(emailContent);
        
        if (textBody) {
          console.log('=== EMAIL TEXT BODY ===');
          console.log(textBody);
          console.log('=== END EMAIL TEXT BODY ===');
          
          // Here you can add additional processing logic
          // For example, save to database, trigger workflows, etc.
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
