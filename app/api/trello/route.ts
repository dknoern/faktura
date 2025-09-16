import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body
    const body = await request.text();
    const signature = request.headers.get('x-trello-webhook');
    
    // Validate signature if webhook secret is configured
    const webhookSecret = process.env.TRELLO_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      // Trello uses base64-encoded HMAC-SHA1
      const expectedSignature = crypto
        .createHmac('sha1', webhookSecret)
        .update(body)
        .digest('base64');
      
      if (signature !== expectedSignature) {
        console.log('Trello webhook signature validation failed');
        console.log('Expected:', expectedSignature);
        console.log('Received:', signature);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      console.log('Trello webhook signature validated successfully');
    } else if (webhookSecret) {
      console.log('Trello webhook secret configured but no signature header found');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    } else {
      console.log('Trello webhook received (no signature validation - TRELLO_WEBHOOK_SECRET not configured)');
    }

    // Parse the JSON body
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (error) {
      console.log('Failed to parse JSON body:', error);
      parsedBody = body;
    }

    // Output the entire POST body for debugging
    console.log('=== TRELLO WEBHOOK RECEIVED ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Body (raw):', body);
    console.log('Body (parsed):', parsedBody);
    console.log('================================');

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received and logged',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing Trello webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification (if needed)
export async function GET() {
  return NextResponse.json({ 
    message: 'Trello webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
