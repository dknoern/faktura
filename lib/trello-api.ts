/**
 * Trello API integration for creating repair cards
 */

interface TrelloCard {
  name: string
  desc: string
  idList: string
  pos?: string
  due?: string
  idMembers?: string[]
  idLabels?: string[]
}

interface TrelloCardResponse {
  id: string
  name: string
  desc: string
  url: string
  shortUrl: string
}

interface RepairCardData {
  repairNumber: string
  repairId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  brand: string
  material: string
  description?: string
  itemValue?: number | string
  repairOptions: {
    service?: boolean
    polish?: boolean
    batteryChange?: boolean
    other?: boolean
  }
  repairNotes?: string
  images?: string[] // Base64 data URLs
}

/**
 * Creates a Trello card for a repair
 */
export async function createTrelloRepairCard(repairData: RepairCardData): Promise<{ success: boolean; cardId?: string; error?: string }> {
  try {
    const apiKey = process.env.TRELLO_API_KEY
    const token = process.env.TRELLO_TOKEN
    const listId = process.env.TRELLO_REPAIR_LIST_ID


    // get all lists from trello
    // await getTrelloLists()

    if (!apiKey || !token || !listId) {
      console.error('Missing Trello configuration. Required: TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_REPAIR_LIST_ID')
      return {
        success: false,
        error: 'Trello API not configured'
      }
    }

    // Build repair options list
    const selectedOptions = []
    if (repairData.repairOptions.service) selectedOptions.push("Service")
    if (repairData.repairOptions.polish) selectedOptions.push("Polish")
    if (repairData.repairOptions.batteryChange) selectedOptions.push("Battery Change")
    if (repairData.repairOptions.other) selectedOptions.push("Other")

    // Create card title
    const cardTitle = `Repair ${repairData.repairNumber} - ${repairData.customerName}`

    // Create detailed description
    const description = `
**Customer:** ${repairData.customerName}
${repairData.customerEmail ? `**Email:** ${repairData.customerEmail}` : ''}
${repairData.customerPhone ? `**Phone:** ${repairData.customerPhone}` : ''}

**Item Details:**
- Brand: ${repairData.brand}
- Material: ${repairData.material}
${repairData.description ? `- Description: ${repairData.description}` : ''}
${repairData.itemValue ? `- Value: $${repairData.itemValue}` : ''}

**Repair Services:**
${selectedOptions.length > 0 ? selectedOptions.map(option => `- ${option}`).join('\n') : '- No specific services selected'}

${repairData.repairNotes ? `**Additional Notes:**\n${repairData.repairNotes}` : ''}

**Repair ID:** ${repairData.repairId}
**Created:** ${new Date().toLocaleString()}
    `.trim()

    const cardData: TrelloCard = {
      name: cardTitle,
      desc: description,
      idList: listId,
      pos: 'top' // Add to top of list
    }

    const url = `https://api.trello.com/1/cards?key=${apiKey}&token=${token}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Trello API error:', response.status, errorText)
      return {
        success: false,
        error: `Trello API error: ${response.status} ${errorText}`
      }
    }

    const cardResponse: TrelloCardResponse = await response.json()
    
    console.log(`Created Trello card for repair #${repairData.repairNumber}: ${cardResponse.shortUrl}`)
    
    // Upload images as attachments if provided
    if (repairData.images && repairData.images.length > 0) {
      await uploadImagesToTrelloCard(cardResponse.id, repairData.images, apiKey, token)
    }
    
    return {
      success: true,
      cardId: cardResponse.id
    }

  } catch (error) {
    console.error('Error creating Trello card:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Batch create Trello cards for multiple repairs
 */
export async function createTrelloRepairCards(repairs: RepairCardData[]): Promise<{
  success: boolean
  results: Array<{ repairNumber: string; success: boolean; cardId?: string; error?: string }>
  totalCreated: number
}> {
  const results = []
  let totalCreated = 0

  for (const repair of repairs) {
    const result = await createTrelloRepairCard(repair)
    results.push({
      repairNumber: repair.repairNumber,
      success: result.success,
      cardId: result.cardId,
      error: result.error
    })

    if (result.success) {
      totalCreated++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return {
    success: totalCreated > 0,
    results,
    totalCreated
  }
}
/**
 * Uploads images to a Trello card as attachments
 */
async function uploadImagesToTrelloCard(cardId: string, images: string[], apiKey: string, token: string): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const dataUrl = images[i]
    
    try {
      // Convert base64 data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      // Create form data for Trello attachment
      const formData = new FormData()
      formData.append('file', blob, `repair-image-${i + 1}.jpg`)
      formData.append('name', `Repair Image ${i + 1}`)
      
      // Upload to Trello
      const uploadUrl = `https://api.trello.com/1/cards/${cardId}/attachments?key=${apiKey}&token=${token}`
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })
      
      if (uploadResponse.ok) {
        console.log(`✓ Uploaded image ${i + 1} to Trello card ${cardId}`)
      } else {
        console.error(`✗ Failed to upload image ${i + 1} to Trello card ${cardId}: ${uploadResponse.status}`)
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`Error uploading image ${i + 1} to Trello card ${cardId}:`, error)
    }
  }
}

/**
 * Fetches all lists from Trello boards and logs them to console
 */
/*
async function getTrelloLists(): Promise<void> {
  try {
    const apiKey = process.env.TRELLO_API_KEY
    const token = process.env.TRELLO_TOKEN

    if (!apiKey || !token) {
      console.error('Missing Trello API credentials')
      return
    }

    // First, get all boards for the authenticated user
    const boardsUrl = `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}`
    const boardsResponse = await fetch(boardsUrl)
    
    if (!boardsResponse.ok) {
      console.error('Failed to fetch Trello boards:', boardsResponse.status)
      return
    }

    const boards = await boardsResponse.json()
    console.log(`\n=== TRELLO BOARDS AND LISTS ===`)
    
    for (const board of boards) {
      console.log(`\nBoard: ${board.name} (ID: ${board.id})`)
      
      // Get lists for this board
      const listsUrl = `https://api.trello.com/1/boards/${board.id}/lists?key=${apiKey}&token=${token}`
      const listsResponse = await fetch(listsUrl)
      
      if (listsResponse.ok) {
        const lists = await listsResponse.json()
        
        if (lists.length > 0) {
          lists.forEach((list: any) => {
            console.log(`  - List: ${list.name} (ID: ${list.id})`)
          })
        } else {
          console.log(`  - No lists found`)
        }
      } else {
        console.error(`  - Failed to fetch lists for board ${board.name}`)
      }
    }
    
    console.log(`\n=== END TRELLO LISTS ===\n`)
    
  } catch (error) {
    console.error('Error fetching Trello lists:', error)
  }
}
*/

