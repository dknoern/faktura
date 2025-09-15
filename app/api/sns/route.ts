import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
        
        // Process the notification here
        // You can add your business logic to handle the SNS notification
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
