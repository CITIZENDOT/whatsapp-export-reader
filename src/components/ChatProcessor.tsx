// src/components/ChatProcessor.tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/messages'
import { extractUsers, parseWhatsAppChat } from '@/utils/chatParser'
import JSZip from 'jszip' // Import JSZip
import { Loader2, RefreshCcw } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import FileUploadArea from './FileUploadArea'

// --- Updated Format Check ---
// Accepts any non-empty text for now. Zip validation happens separately.
const checkTextFormat = (text: string): boolean => {
  return !!text && text.trim().length > 0
}
// ---

// --- Define the structure for processed data ---
interface ProcessedChatData {
  chatText: string
  // Mapping from original attachment filename to its Blob URL
  attachments: Record<string, string>
}
// ---

// --- Updated ChatView ---
interface ChatViewProps {
  data: ProcessedChatData // Accepts the new data structure
  onReset: () => void
}
const ChatView: React.FC<ChatViewProps> = ({ data, onReset }) => {
  const [isLoading, setIsLoading] = useState(true)
  const attachmentCount = Object.keys(data.attachments).length
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<string[]>([])

  useEffect(() => {
    const strippedUnicode = data.chatText.replace(/\u200E/g, '').replace(/\u202F/g, ' ')
    const messages = parseWhatsAppChat(strippedUnicode)
    const users = extractUsers(messages)
    setMessages(messages)
    setUsers(users)
    setIsLoading(false)
  }, [data.chatText])

  return (
    <Card className="animate-in fade-in w-full duration-500">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Chat View</CardTitle>
          <CardDescription>
            Displaying processed chat text.
            {attachmentCount > 0 && ` Found ${attachmentCount} attachment reference(s).`}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="flex-shrink-0">
          <RefreshCcw className="mr-2 h-4 w-4" /> Load New Chat
        </Button>
      </CardHeader>
      <CardContent>
        {/* Render Attachment List (Example) */}
        {attachmentCount > 0 && (
          <div className="bg-muted/50 mb-4 max-h-40 overflow-y-auto rounded-md border p-3">
            <h4 className="mb-2 text-sm font-medium">Attachment References:</h4>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              {Object.entries(data.attachments).map(([filename, blobUrl]) => (
                <li key={filename}>
                  {/* In a real implementation, you might link to the blobUrl */}
                  {filename}
                  {/* <a href={blobUrl} target="_blank" rel="noopener noreferrer">{filename}</a> */}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Render Chat Text */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          <pre className="bg-muted max-h-[60vh] overflow-auto rounded-md p-4 text-sm break-words whitespace-pre-wrap">
            {data.chatText}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
// ---

const ChatProcessor: React.FC = () => {
  // State holds the processed text and attachment URLs
  const [processedData, setProcessedData] = useState<ProcessedChatData | null>(null)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showChatView, setShowChatView] = useState<boolean>(false)

  // Effect to trigger showing chat view *after* data is set
  useEffect(() => {
    if (processedData && !isLoading) {
      setShowChatView(true)
    } else {
      setShowChatView(false)
    }
  }, [processedData, isLoading])

  // --- Effect for cleaning up Blob URLs ---
  useEffect(() => {
    // Store the current attachment map when the effect runs
    const currentAttachments = processedData?.attachments
    // Return a cleanup function
    return () => {
      if (currentAttachments) {
        console.log('Revoking', Object.keys(currentAttachments).length, 'Blob URLs')
        Object.values(currentAttachments).forEach(URL.revokeObjectURL)
      }
    }
  }, [processedData]) // Dependency: run cleanup when processedData changes

  // --- Clear existing data and revoke URLs ---
  const clearData = () => {
    // Revoke existing URLs *before* clearing state
    if (processedData?.attachments) {
      console.log('Revoking', Object.keys(processedData.attachments).length, 'Blob URLs on clear')
      Object.values(processedData.attachments).forEach(URL.revokeObjectURL)
    }
    setProcessedData(null)
    setProcessingError(null)
    setShowChatView(false)
  }

  // --- Process ZIP File ---
  const processZipFile = async (file: File) => {
    clearData()
    setIsLoading(true)
    const zip = new JSZip()
    try {
      await zip.loadAsync(file) // Load zip data

      const chatFile = zip.file('_chat.txt') // Look for _chat.txt
      if (!chatFile) {
        throw new Error("'_chat.txt' not found within the zip file.")
      }

      // Extract chat text
      const chatText = await chatFile.async('string')

      // Extract attachments and create Blob URLs
      const attachments: Record<string, string> = {}
      const attachmentPromises: Promise<void>[] = []

      zip.forEach((relativePath, zipEntry) => {
        // Skip directories and the chat file itself
        if (!zipEntry.dir && zipEntry.name !== '_chat.txt') {
          attachmentPromises.push(
            (async () => {
              try {
                const blob = await zipEntry.async('blob')
                const blobUrl = URL.createObjectURL(blob)
                attachments[zipEntry.name] = blobUrl // Store filename -> blobUrl
              } catch (blobError) {
                console.error(`Error processing attachment ${zipEntry.name}:`, blobError)
                // Decide if you want to fail the whole process or just skip the attachment
              }
            })()
          )
        }
      })

      // Wait for all attachments to be processed
      await Promise.all(attachmentPromises)

      // Set processed data state
      setProcessedData({ chatText, attachments })
      setProcessingError(null)
    } catch (error: any) {
      console.error('Error processing zip file:', error)
      const message = error instanceof Error ? error.message : 'Failed to process zip file.'
      setProcessingError(message)
      setProcessedData(null) // Ensure no partial data is shown
    } finally {
      setIsLoading(false)
    }
  }

  // --- Process Plain Text File ---
  const processTextFile = (file: File) => {
    clearData()
    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = event => {
      const text = event.target?.result as string
      if (text) {
        // Simple check for text files
        if (checkTextFormat(text)) {
          // Set data with empty attachments for .txt
          setProcessedData({ chatText: text, attachments: {} })
          setProcessingError(null)
        } else {
          // This check is basic, might remove if not needed
          setProcessingError('The text file appears empty or invalid.')
          setProcessedData(null)
        }
      } else {
        setProcessingError('Could not read the file content.')
        setProcessedData(null)
      }
      setIsLoading(false)
    }
    reader.onerror = () => {
      setProcessingError('Error reading the file.')
      setProcessedData(null)
      setIsLoading(false)
    }
    reader.readAsText(file)
  }

  // --- Handler for File Selection ---
  const handleFileSelected = useCallback((file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'txt') {
      processTextFile(file)
    } else if (fileExtension === 'zip') {
      processZipFile(file) // Call async zip processor
    } else {
      // Should ideally be caught by FileUploadArea, but good fallback
      clearData()
      setProcessingError('Unsupported file type. Use .txt or .zip.')
      setIsLoading(false)
    }
  }, []) // Dependencies needed? only uses state setters

  // --- Handler for Text Paste ---
  const handleTextPasted = useCallback((text: string) => {
    clearData()
    setIsLoading(true)
    // Simulate async slightly if needed
    setTimeout(() => {
      if (checkTextFormat(text)) {
        // Set data with empty attachments for pasted text
        setProcessedData({ chatText: text, attachments: {} })
        setProcessingError(null)
      } else {
        setProcessingError('Pasted text appears empty or invalid.')
        setProcessedData(null)
      }
      setIsLoading(false)
    }, 10)
  }, [])

  // --- Function to Reset State ---
  const resetView = () => {
    clearData() // Use the new clearData function
    setIsLoading(false)
  }

  // --- Render Logic ---
  const containerMaxWidth = showChatView ? 'max-w-4xl' : 'max-w-lg'

  return (
    <div
      className={cn(
        'mx-auto w-full transition-[max-width] duration-500 ease-in-out',
        containerMaxWidth
      )}
    >
      {isLoading && (
        <Card className="animate-in fade-in w-full text-center duration-300">
          {/* ... Loading UI ... */}
          <CardHeader>
            <CardTitle>Processing...</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      )}

      {!isLoading && showChatView && processedData && (
        // Pass the whole processedData object
        <ChatView data={processedData} onReset={resetView} />
      )}

      {!isLoading && !showChatView && (
        <div className="animate-in fade-in duration-300">
          <FileUploadArea
            onFileSelect={handleFileSelected}
            onTextSubmit={handleTextPasted}
            processingError={processingError}
          />
        </div>
      )}
    </div>
  )
}

export default ChatProcessor
