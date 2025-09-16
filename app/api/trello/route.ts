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
    console.log('Body (parsed):', JSON.stringify(parsedBody, null, 2));
    
    // Parse out specific card data if present
    if (parsedBody && parsedBody.action && parsedBody.action.data && parsedBody.action.data.card) {
      const card = parsedBody.action.data.card;
      console.log('--- CARD DETAILS ---');
      console.log('Card ID:', card.id);
      console.log('Card Name:', card.name);
      console.log('Card Short Link:', card.shortLink);
      console.log('Card URL:', card.shortUrl);
      if (card.desc) console.log('Card Description:', card.desc);
      if (card.due) console.log('Card Due Date:', card.due);
      if (card.labels && card.labels.length > 0) {
        console.log('Card Labels:', card.labels.map((label: any) => `${label.name} (${label.color})`).join(', '));
      }
      if (card.members && card.members.length > 0) {
        console.log('Card Members:', card.members.map((member: any) => member.fullName || member.username).join(', '));
      }
      console.log('-------------------');
    }
    
    // Parse out list data if present
    if (parsedBody && parsedBody.action && parsedBody.action.data && parsedBody.action.data.list) {
      const list = parsedBody.action.data.list;
      console.log('--- LIST DETAILS ---');
      console.log('List ID:', list.id);
      console.log('List Name:', list.name);
      console.log('-------------------');
    }
    
    // Parse out board data if present
    if (parsedBody && parsedBody.action && parsedBody.action.data && parsedBody.action.data.board) {
      const board = parsedBody.action.data.board;
      console.log('--- BOARD DETAILS ---');
      console.log('Board ID:', board.id);
      console.log('Board Name:', board.name);
      console.log('Board Short Link:', board.shortLink);
      console.log('--------------------');
    }
    
    // Show action type and member info
    if (parsedBody && parsedBody.action) {
      console.log('--- ACTION DETAILS ---');
      console.log('Action Type:', parsedBody.action.type);
      console.log('Action Date:', parsedBody.action.date);
      if (parsedBody.action.memberCreator) {
        console.log('Action By:', parsedBody.action.memberCreator.fullName || parsedBody.action.memberCreator.username);
      }
      console.log('---------------------');
    }
    
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
