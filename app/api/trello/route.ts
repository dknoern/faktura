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
    
    // Parse out specific card data if present and fetch full details from Trello API
    if (parsedBody && parsedBody.action && parsedBody.action.data && parsedBody.action.data.card) {
      const card = parsedBody.action.data.card;
      const cardId = card.id;
      
      console.log('--- WEBHOOK CARD DATA ---');
      console.log('Card ID:', cardId);
      console.log('Card Name:', card.name);
      console.log('Card Short Link:', card.shortLink);
      console.log('Card URL:', card.shortUrl);
      console.log('-------------------------');

      // Fetch full card details from Trello REST API
      const trelloApiKey = process.env.TRELLO_API_KEY;
      const trelloToken = process.env.TRELLO_TOKEN;
      
      if (trelloApiKey && trelloToken && cardId) {
        try {
          const trelloApiUrl = `https://api.trello.com/1/cards/${cardId}?key=${trelloApiKey}&token=${trelloToken}&fields=all&members=true&member_fields=all&checklists=all&attachments=true&actions=all&actions_limit=50`;
          
          console.log('Fetching card details from Trello API...');
          const response = await fetch(trelloApiUrl);
          
          if (response.ok) {
            const fullCardData = await response.json();
            
            console.log('--- FULL CARD DETAILS FROM API ---');
            console.log('Card ID:', fullCardData.id);
            console.log('Card Name:', fullCardData.name);
            console.log('Card Description:', fullCardData.desc || 'No description');
            console.log('Card URL:', fullCardData.url);
            console.log('Card Short URL:', fullCardData.shortUrl);
            console.log('Due Date:', fullCardData.due || 'No due date');
            console.log('Due Complete:', fullCardData.dueComplete);
            console.log('Closed:', fullCardData.closed);
            console.log('Position:', fullCardData.pos);
            console.log('Date Last Activity:', fullCardData.dateLastActivity);
            
            // Labels
            if (fullCardData.labels && fullCardData.labels.length > 0) {
              console.log('Labels:');
              fullCardData.labels.forEach((label: any) => {
                console.log(`  - ${label.name || 'Unnamed'} (${label.color})`);
              });
            } else {
              console.log('Labels: None');
            }
            
            // Members
            if (fullCardData.members && fullCardData.members.length > 0) {
              console.log('Members:');
              fullCardData.members.forEach((member: any) => {
                console.log(`  - ${member.fullName} (@${member.username})`);
              });
            } else {
              console.log('Members: None assigned');
            }
            
            // Checklists
            if (fullCardData.checklists && fullCardData.checklists.length > 0) {
              console.log('Checklists:');
              fullCardData.checklists.forEach((checklist: any) => {
                console.log(`  - ${checklist.name} (${checklist.checkItems.length} items)`);
                checklist.checkItems.forEach((item: any) => {
                  const status = item.state === 'complete' ? '✓' : '○';
                  console.log(`    ${status} ${item.name}`);
                });
              });
            } else {
              console.log('Checklists: None');
            }
            
            // Attachments
            if (fullCardData.attachments && fullCardData.attachments.length > 0) {
              console.log('Attachments:');
              fullCardData.attachments.forEach((attachment: any) => {
                console.log(`  - ${attachment.name} (${attachment.url})`);
              });
            } else {
              console.log('Attachments: None');
            }
            
            // Recent Actions
            if (fullCardData.actions && fullCardData.actions.length > 0) {
              console.log('Recent Actions:');
              fullCardData.actions.slice(0, 5).forEach((action: any) => {
                console.log(`  - ${action.type} by ${action.memberCreator?.fullName || 'Unknown'} on ${action.date}`);
              });
            }
            
            console.log('----------------------------------');
            
          } else {
            console.log('Failed to fetch card details from Trello API:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching card details from Trello API:', error);
        }
      } else {
        console.log('Trello API credentials not configured or card ID missing');
        console.log('TRELLO_API_KEY:', trelloApiKey ? 'Set' : 'Not set');
        console.log('TRELLO_TOKEN:', trelloToken ? 'Set' : 'Not set');
        console.log('Card ID:', cardId || 'Not found');
      }
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
