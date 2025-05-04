import { type ChatMessage } from '../types/messages'

/**
 * Extract all unique users from chat messages
 * @param messages Array of parsed chat messages
 * @returns Array of unique user names
 */
export function extractUsers(messages: ChatMessage[]): string[] {
  // Create a Set to store unique users
  const usersSet = new Set<string>()
  
  // Iterate through messages and add senders to the set
  messages.forEach(message => {
    // Only consider messages with senders (text and attachment messages)
    if ('sender' in message && message.sender) {
      usersSet.add(message.sender.trim())
    }
  })
  
  // Convert Set to Array and sort alphabetically
  return Array.from(usersSet).sort((a, b) => a.localeCompare(b))
}

/**
 * Parse WhatsApp chat export text into an array of message objects
 */
export function parseWhatsAppChat(chatText: string): ChatMessage[] {
  if (!chatText || typeof chatText !== 'string') {
    return []
  }

  const lines = chatText.split('\n')
  const messages: ChatMessage[] = []

  // Detect format (bracket or dash style)
  const isBracketFormat = lines[0]?.trim().startsWith('[')

  let currentMessage: ChatMessage | null = null
  let currentMessageString = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Check if this line starts a new message
    const isNewMessage = isBracketFormat
      ? line.startsWith('[')
      : line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s[AP]M\s-\s/)

    if (isNewMessage) {
      // Process previous message if exists
      if (currentMessage) {
        if (currentMessage.type === 'text') {
          currentMessage.text = currentMessageString
        }
        messages.push(currentMessage)
      }

      // Start a new message
      try {
        currentMessage = isBracketFormat ? parseBracketFormat(line) : parseDashFormat(line)
        currentMessageString = currentMessage?.type === 'text' ? currentMessage.text : ''
      } catch (error) {
        console.error(`Failed to parse line: ${line}`, error)
        currentMessage = null
        currentMessageString = ''
      }
    } else if (currentMessage && currentMessage.type === 'text') {
      // This is a continuation of the previous message
      currentMessageString += '\n' + line
    }
  }

  // Add the last message if exists
  if (currentMessage) {
    if (currentMessage.type === 'text') {
      currentMessage.text = currentMessageString
    }
    messages.push(currentMessage)
  }

  return messages
}

/**
 * Parse bracket format: [date, time] sender: message
 */
function parseBracketFormat(line: string): ChatMessage | null {
  // Match [date, time] sender: message
  const match = line.match(
    /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}:\d{2}\s[AP]M)\]\s([^:]+)(?::\s(.*))?$/
  )

  if (!match) return null

  const [, dateStr, timeStr, sender, content = ''] = match
  const datetime = parseDateTime(`${dateStr}, ${timeStr}`, true) // true for bracket format

  // Check for system messages
  if (
    content.includes('Messages and calls are end-to-end encrypted') ||
    content.includes('created this group') ||
    content.includes('added you') ||
    content.includes('Missed voice call') ||
    content.includes('Voice call')
  ) {
    return {
      type: 'system',
      datetime,
      text: content || line,
    }
  }

  // Check for attachment messages - bracket format: <attached: filename>
  if (content.includes('<attached:')) {
    const fileName = extractAttachmentName(content)

    return {
      type: 'attachment',
      sender,
      datetime,
      fileName,
    }
  }

  // Default to text message
  return {
    type: 'text',
    sender,
    datetime,
    text: content,
  }
}

/**
 * Parse dash format: date, time - sender: message
 */
function parseDashFormat(line: string): ChatMessage | null {
  // Match date, time - sender: message
  const match = line.match(
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}\s[AP]M)\s-\s([^:]+)?(?::\s(.*))?$/
  )

  if (!match) return null

  const [, dateStr, timeStr, sender, content = ''] = match
  const datetime = parseDateTime(`${dateStr}, ${timeStr}`, false) // false for dash format

  // Check for system messages
  if (
    !sender || // No sender means it's likely a system message
    !content ||
    (sender &&
      !sender.includes(':') &&
      (line.includes('Messages and calls are end-to-end encrypted') ||
        line.includes('created this group') ||
        line.includes('added you')))
  ) {
    // For system messages, extract the full text after the timestamp
    const systemTextMatch = line.match(
      /^\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}\s[AP]M\s-\s(.+)$/
    )
    const systemText = systemTextMatch ? systemTextMatch[1] : line

    return {
      type: 'system',
      datetime,
      text: systemText,
    }
  }

  // Check for attachment messages in dash format: filename (file attached)
  if (
    content.includes('(file attached)') ||
    content.match(/\.(jpg|jpeg|png|gif|mp4|pdf|doc|docx)\s/i)
  ) {
    const fileName = extractDashFormatFileName(content)

    return {
      type: 'attachment',
      sender,
      datetime,
      fileName,
    }
  }

  // Default to text message
  return {
    type: 'text',
    sender,
    datetime,
    text: content,
  }
}

/**
 * Parse date and time strings into a Date object
 */
function parseDateTime(dateTimeStr: string, isBracketFormat = true): Date {
  // Handle different date formats
  let parsedDate: Date

  try {
    const [datePart, timePart] = dateTimeStr.split(', ')

    // Handle different date formats
    let day, month, yearPart

    if (isBracketFormat) {
      // Bracket format: day/month/year
      ;[day, month, yearPart] = datePart.split('/')
    } else {
      // Dash format: month/day/year
      ;[month, day, yearPart] = datePart.split('/')
    }

    // Handle 2-digit years
    let year = yearPart
    if (yearPart.length === 2) {
      year = `20${yearPart}` // Assume 20xx for 2-digit years
    }

    // Reformat to ISO-compatible string
    const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${convertTo24Hour(timePart)}`
    parsedDate = new Date(isoDateStr)
    return parsedDate
  } catch (error) {
    console.error(`Failed to parse date: ${dateTimeStr}`, error)
    parsedDate = new Date() // Fallback to current date
  }

  return parsedDate
}

/**
 * Convert 12-hour time format to 24-hour format
 */
function convertTo24Hour(timeStr: string): string {
  const [time, period] = timeStr.split(' ')
  let [hours, minutes, seconds = '00'] = time.split(':')

  let hourNum = parseInt(hours, 10)

  if (period === 'PM' && hourNum < 12) {
    hourNum += 12
  } else if (period === 'AM' && hourNum === 12) {
    hourNum = 0
  }

  return `${hourNum.toString().padStart(2, '0')}:${minutes}:${seconds}`
}

/**
 * Extract attachment filename from bracket format content string
 * Example: <attached: filename.jpg>
 */
function extractAttachmentName(content: string): string {
  const match = content.match(/<attached:\s*([^>]+)>/)
  return match ? match[1] : content
}

/**
 * Extract attachment filename from dash format content string
 * Example: IMG-20250503-WA0012.jpg (file attached)
 */
function extractDashFormatFileName(content: string): string {
  // Match filename before "(file attached)"
  const fileMatch = content.match(/([^/\\&*?<>|:"]+\.[a-zA-Z0-9]+)\s*\(file attached\)/)
  if (fileMatch) return fileMatch[1].trim()

  // If no match, try to extract any filename pattern
  const extensionMatch = content.match(/([^/\\&*?<>|:"]+\.[a-zA-Z0-9]+)/)
  return extensionMatch ? extensionMatch[1].trim() : content
}
