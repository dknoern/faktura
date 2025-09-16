import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { searchCustomers } from '@/lib/kiosk-actions';
import { createCustomer } from '@/app/actions/customers';
import { getNextRepairNumber, createRepairRecord } from '@/lib/repair-utils';
import { createLog } from '@/app/actions/logs';
import { z } from 'zod';
import { logSchema, lineItemSchema } from '@/lib/models/log';

type LogData = z.infer<typeof logSchema>;
type LineItem = z.infer<typeof lineItemSchema>;

// Method to parse markdown-formatted card description
function parseCardDescription(description: string) {
  const fields = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    brand: '',
    model: '',
    material: '',
    referenceNumber: '',
    repairEstimateOptions: ''
  };

  if (!description) return fields;

  // Parse each field using regex patterns
  const patterns = {
    firstName: /\*\*First Name:\*\*\s*([^\n\r]+)/i,
    lastName: /\*\*Last Name:\*\*\s*([^\n\r]+)/i,
    email: /\*\*E-mail:\*\*\s*\[([^\]]+)\]|\*\*E-mail:\*\*\s*([^\n\r]+)/i,
    phoneNumber: /\*\*Phone Number:\*\*\s*([^\n\r]+)/i,
    brand: /\*\*Brand:\*\*\s*([^\n\r]+)/i,
    model: /\*\*Rolex Model:\*\*\s*([^\n\r]+)/i,
    material: /\*\*Material:\*\*\s*([^\n\r]+)/i,
    referenceNumber: /\*\*Reference number if known:\*\*\s*([^\n\r]+)/i,
    repairEstimateOptions: /\*\*Repair Estimate Options:\*\*\s*\[([^\]]+)\]/i
  };

  // Extract each field
  Object.keys(patterns).forEach(key => {
    const match = description.match(patterns[key as keyof typeof patterns]);
    if (match) {
      // For email, check both capture groups since we have an OR pattern
      if (key === 'email') {
        fields[key as keyof typeof fields] = (match[1] || match[2] || '').trim();
      } else if (match[1]) {
        fields[key as keyof typeof fields] = match[1].trim();
      }
    }
  });

  return fields;
}

// Parse repair number from card name (e.g., "Repair #45⁠ : David⁠ Knoernschld" -> "45")
function parseRepairNumberFromCardName(cardName: string): string | null {
  const match = cardName.match(/Repair\s*#(\d+)/i);
  return match ? match[1] : null;
}

// Process repair request from Trello card data
async function processRepairRequest(parsedFields: any, cardName: string) {
  try {
    console.log('--- PROCESSING REPAIR REQUEST ---');
    
    // Search for existing customer
    let customer = null;
    if (parsedFields.firstName && parsedFields.lastName) {
      const searchParams = {
        firstName: parsedFields.firstName,
        lastName: parsedFields.lastName,
        email: parsedFields.email || undefined,
        phone: parsedFields.phoneNumber || undefined
      };
      
      console.log('Searching for existing customer with params:', searchParams);
      const existingCustomers = await searchCustomers(searchParams);
      
      if (existingCustomers.length > 0) {
        customer = existingCustomers[0];
        console.log('Found existing customer:', customer._id, customer.firstName, customer.lastName);
      }
    }
    
    // Create new customer if not found
    if (!customer && parsedFields.firstName && parsedFields.lastName) {
      console.log('Creating new customer...');
      const customerData = {
        firstName: parsedFields.firstName,
        lastName: parsedFields.lastName,
        email: parsedFields.email || '',
        phone: parsedFields.phoneNumber || '',
        cell: '',
        company: '',
        customerType: 'Individual',
        status: 'Active'
      };
      
      const customerResult = await createCustomer(customerData);
      if (customerResult.success && customerResult.data) {
        customer = {
          _id: customerResult.data._id.toString(),
          firstName: customerResult.data.firstName,
          lastName: customerResult.data.lastName,
          email: customerResult.data.email,
          phone: customerResult.data.phone
        };
        console.log('Created new customer:', customer._id, customer.firstName, customer.lastName);
      } else {
        console.error('Failed to create customer:', customerResult.error);
        return;
      }
    }
    
    if (!customer) {
      console.log('No customer found or created - skipping repair creation');
      return;
    }
    
    // Parse repair estimate options
    const repairOptions = {
      service: false,
      polish: false,
      batteryChange: false,
      other: false
    };
    
    if (parsedFields.repairEstimateOptions) {
      const options = parsedFields.repairEstimateOptions.toLowerCase();
      repairOptions.service = options.includes('service');
      repairOptions.polish = options.includes('polish');
      repairOptions.batteryChange = options.includes('battery');
      repairOptions.other = options.includes('other');
    }
    
    // Parse repair number from card name or get next available number
    const parsedRepairNumber = parseRepairNumberFromCardName(cardName);
    const repairNumber = parsedRepairNumber || await getNextRepairNumber();
    
    console.log('Creating repair record...');
    console.log('Repair number:', parsedRepairNumber ? `${repairNumber} (from card name)` : `${repairNumber} (generated)`);
    
    const repairData = {
      repairNumber,
      customerId: customer._id,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      email: customer.email || '',
      phone: customer.phone || '',
      brand: parsedFields.brand || 'Unknown',
      material: parsedFields.material || 'Unknown',
      description: parsedFields.model || '',
      itemValue: '',
      repairOptions,
      repairNotes: `Reference: ${parsedFields.referenceNumber || 'N/A'}\nTrello Card: ${cardName}`
    };
    
    const repairResult = await createRepairRecord(repairData);
    if (repairResult.success) {
      console.log('Created repair:', repairResult.repairNumber);
      
      // Create log entry
      console.log('Creating log entry...');
      const lineItems: LineItem[] = [{
        itemNumber: '',
        name: `${parsedFields.brand || 'Unknown'} ${parsedFields.material || ''} ${parsedFields.model || ''} - Repair #${repairResult.repairNumber}`.trim(),
        repairNumber: repairResult.repairNumber || ''
      }];
      
      const logData: LogData = {
        date: new Date(),
        receivedFrom: "Trello",
        comments: `Trello repair request\nCard: ${cardName}\nReference: ${parsedFields.referenceNumber || 'N/A'}`,
        customerName: `${customer.firstName} ${customer.lastName}`,
        vendor: '',
        user: "Trello Webhook",
        lineItems
      };
      
      const logResult = await createLog(logData);
      if (logResult.success) {
        console.log('Created log entry:', logResult.data?._id);
        console.log('--- REPAIR REQUEST PROCESSED SUCCESSFULLY ---');
      } else {
        console.error('Failed to create log entry:', logResult.error);
      }
    } else {
      console.error('Failed to create repair:', repairResult.error);
    }
    
  } catch (error) {
    console.error('Error processing repair request:', error);
  }
}

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

    // Parse out specific card data if present and fetch full details from Trello API
    if (parsedBody && parsedBody.action && parsedBody.action.type === 'createCard' && parsedBody.action.data && parsedBody.action.data.card) {
      console.log('Body (parsed):', JSON.stringify(parsedBody, null, 2));
     
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
            
            // Parse the card description for structured fields
            if (fullCardData.desc) {
              const parsedFields = parseCardDescription(fullCardData.desc);
              console.log('--- PARSED DESCRIPTION FIELDS ---');
              console.log('First Name:', parsedFields.firstName || 'Not found');
              console.log('Last Name:', parsedFields.lastName || 'Not found');
              console.log('Email:', parsedFields.email || 'Not found');
              console.log('Phone Number:', parsedFields.phoneNumber || 'Not found');
              console.log('Brand:', parsedFields.brand || 'Not found');
              console.log('Model:', parsedFields.model || 'Not found');
              console.log('Material:', parsedFields.material || 'Not found');
              console.log('Reference Number:', parsedFields.referenceNumber || 'Not found');
              console.log('Repair Estimate Options:', parsedFields.repairEstimateOptions || 'Not found');
              console.log('----------------------------------');
              
              // Process the parsed data to create customer and repair
              await processRepairRequest(parsedFields, fullCardData.name);
            }
            
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
