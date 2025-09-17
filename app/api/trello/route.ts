import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { searchCustomers } from '@/lib/kiosk-actions';
import { createCustomer } from '@/app/actions/customers';
import { getNextRepairNumber, createRepairRecord } from '@/lib/repair-utils';
import { createLog } from '@/app/actions/logs';
import { z } from 'zod';
import { logSchema, lineItemSchema } from '@/lib/models/log';
import console from 'console';

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

// Parse repair details from card name for attachment processing
function parseRepairDetailsFromCardName(cardName: string) {
    // Clean the card name by removing invisible characters and normalizing whitespace
    const cleanedName = cardName.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
    
    console.log('Parsing card name:', cardName);
    console.log('Cleaned card name:', cleanedName);
    
    // Pattern: "Repair 2725 - Ke Chau", "Repair #61 : David Knoernschild", "Repair 45 John Doe"
    // First capture the repair number, then skip any non-alphanumeric characters, then capture names
    const match = cleanedName.match(/Repair\s*#?(\d+)\s*[^\w]*\s*(\w+)(?:\s+(\w+))?/i);
    
    console.log('Regex match result:', match);
    
    if (match) {
        const result = {
            repairNumber: match[1],
            customerFirstName: match[2] || '',
            customerLastName: match[3] || ''
        };
        console.log('Parsed result:', result);
        return result;
    }
    console.log('No match found');
    return null;
}

// Check if a repair already exists with the given details
async function findExistingRepair(cardName: string) {

    const repairDetails = parseRepairDetailsFromCardName(cardName);
    console.log('--- CHECKING FOR DUPLICATE REPAIR ---');
    console.log('Repair Number:', repairDetails?.repairNumber);
    console.log('Customer First Name:', repairDetails?.customerFirstName);
    console.log('Customer Last Name:', repairDetails?.customerLastName);
    
    // Search for existing repair
    const connectToDatabase = (await import('../../../lib/dbConnect')).default;
    await connectToDatabase();
    const { Repair } = await import('../../../lib/models/repair');
    
    const existingRepair = await Repair.findOne({
        repairNumber: repairDetails?.repairNumber,
        customerFirstName: new RegExp(`^${repairDetails?.customerFirstName}$`, 'i'),
        customerLastName: new RegExp(`^${repairDetails?.customerLastName}$`, 'i')
    });
    
    if (existingRepair) {
        console.log('--- REPAIR FOUND ---');
        console.log('Existing repair ID:', existingRepair._id);
        console.log('------------------------------');
        return existingRepair;
    } else {
        console.log('No duplicate repair found');
        return null;
    }
}

// Download and save attachment to repair
async function processAttachmentForRepair(attachmentUrl: string, repairId: string, fileName: string) {

    console.log('Downloading attachment from URL:', attachmentUrl);

    // Add Trello OAuth authentication header
    const trelloApiKey = process.env.TRELLO_API_KEY;
    const trelloToken = process.env.TRELLO_TOKEN;

    if (!trelloApiKey || !trelloToken) {
        throw new Error('Trello API credentials not configured');
    }

    // Create OAuth Authorization header
    const authHeader = `OAuth oauth_consumer_key="${trelloApiKey}", oauth_token="${trelloToken}"`;

    console.log('Downloading with OAuth authorization...');

    // Download the attachment with OAuth authorization
    const response = await fetch(attachmentUrl, {
        headers: {
            'Authorization': authHeader
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to download attachment: ${response.status} ${response.statusText}`);
    }

    console.log('Download response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Download response status:', response.status);

    const buffer = await response.arrayBuffer();
    console.log('Downloaded buffer size:', buffer.byteLength);

    // Process and save image using same logic as upload route
    const timestamp = Math.floor(Date.now() / 1000);
    const originalName = fileName;
    const newFileName = `${repairId}-${timestamp}-${originalName}`;

    // Import required modules
    const sharp = (await import('sharp')).default;
    const { saveImage } = await import('../../../lib/utils/storage');

    // Process image with Sharp - add error handling for metadata
    const image = sharp(Buffer.from(buffer));
    let metadata;
    try {
        metadata = await image.metadata();
        console.log('Image metadata:', metadata);
    } catch (metadataError) {
        console.error('Failed to read image metadata:', metadataError);
        // If we can't read metadata, save the raw buffer without processing
        await saveImage(Buffer.from(buffer), newFileName);
        console.log('Successfully saved attachment to repair (raw):', repairId);
        return true;
    }

    // If image is larger than 1200px in any dimension, resize it
    if (metadata.width && metadata.width > 1200 || metadata.height && metadata.height > 1200) {
        const resizedImage = await image
            .resize(1200, 1200, {
                fit: 'inside', // Maintain aspect ratio
                withoutEnlargement: true // Don't enlarge if smaller
            })
            .toBuffer();
        await saveImage(resizedImage, newFileName);
    } else {
        const processedBuffer = await image.toBuffer();
        await saveImage(processedBuffer, newFileName);
    }

    console.log('Successfully saved attachment to repair:', repairId, 'as', newFileName);
    return true;
}


// Process repair request from Trello card data
async function createRepair(parsedFields: any, cardName: string) {

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

        console.log('=== TRELLO WEBHOOK RECEIVED ===');
        console.log('Body (raw):', body);

        // Parse the JSON body
        const parsedBody = JSON.parse(body);

        const actionType = parsedBody.action.type;
        console.log('actionType:', actionType);

        const actionData = parsedBody.action.data;

        if (actionType === 'createCard') {
            console.log('Action type: createCard');
            handleCreateCard(actionData);
        } else if (actionType === 'addAttachmentToCard') {
            console.log('Action type: addAttachmentToCard');
            handleAddAttachmentToCard(actionData);
        } else {
            console.log('unsupported actionType, nothing to do');
        }

        return NextResponse.json({ success: true });

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


async function handleCreateCard(actionData: any) {
    console.log('--- CREATE CARD ---');
    console.log('Card ID:', actionData.card.id);
    console.log('Card Name:', actionData.card.name);
    console.log('---------------------');

    // Add Trello OAuth authentication header
    const trelloApiKey = process.env.TRELLO_API_KEY;
    const trelloToken = process.env.TRELLO_TOKEN;

    if (!trelloApiKey || !trelloToken) {
        throw new Error('Trello API credentials not configured');
    }

    const trelloApiUrl = `https://api.trello.com/1/cards/${actionData.card.id}?key=${trelloApiKey}&token=${trelloToken}&fields=all&members=true&member_fields=all&checklists=all&attachments=true&actions=all&actions_limit=50`;

    console.log('Fetching card details from Trello API...');
    const response = await fetch(trelloApiUrl);

    if (response.ok) {
        const fullCardData = await response.json();

        console.log('--- CARD DETAILS FROM API ---');
        console.log('Card ID:', fullCardData.id);
        console.log('Card Name:', fullCardData.name);
        console.log('Card Description:', fullCardData.desc || 'No description');

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

            // Check for duplicate repair before creating
            const existingRepair = await findExistingRepair(fullCardData.name);

            if (existingRepair) {
                console.log('Skipping repair creation to avoid duplicate');
            } else {
                console.log('No duplicate repair found, proceeding with creation');
                // Process the parsed data to create customer and repair
                await createRepair(parsedFields, fullCardData.name);
            }
        }
    } else {
        console.log('Failed to fetch card details from Trello API:', response.status, response.statusText);
    }
}


async function handleAddAttachmentToCard(actionData: any) {
    console.log('--- ADD ATTACHMENT TO CARD ---');
    console.log('Card ID:', actionData.card.id);
    console.log('Attachment ID:', actionData.attachment.id);
    console.log('Attachment Name:', actionData.attachment.name);
    console.log('Attachment URL:', actionData.attachment.url);
    console.log('---------------------');

    const attachment = actionData.attachment;
    const card = actionData.card;

    console.log('--- ATTACHMENT ADDED TO CARD ---');
    console.log('Card ID:', card.id);
    console.log('Card Name:', card.name);
    console.log('Attachment ID:', attachment.id);
    console.log('Attachment Name:', attachment.name);
    console.log('Attachment URL:', attachment.url);
    console.log('--------------------------------');

    // Parse repair details from card name
    const repairDetails = parseRepairDetailsFromCardName(card.name);

    if(repairDetails){
        const existingRepair = await findExistingRepair(card.name);
        
        if(existingRepair){
            console.log('existing repair found, saving attachment to repair');
            await processAttachmentForRepair(attachment.url, existingRepair._id.toString(), attachment.name);
            console.log('Successfully processed attachment for repair');
        }else{
            console.log("repair not found, will not save attachment")
        }
    } else {
        console.log('Could not parse repair details from card name:', card.name);
    }
}
