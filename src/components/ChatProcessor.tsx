// src/components/ChatProcessor.tsx
import { cn } from '@/lib/utils'
import JSZip from 'jszip'
import { Loader2 } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import ChatView from './ChatView'
import FileUploadArea from './FileUploadArea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

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

      // Find any .txt file in the zip
      let chatFile: JSZip.JSZipObject | null = null
      let chatFileName = ''

      // First look for files directly in the root
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.txt') && !chatFile) {
          chatFile = zipEntry
          chatFileName = relativePath
        }
      })

      if (!chatFile) {
        throw new Error('No text file found within the zip file.')
      }

      // Extract chat text
      // @ts-ignore
      const chatText = await chatFile.async('string')

      // Extract attachments and create Blob URLs
      const attachments: Record<string, string> = {}
      const attachmentPromises: Promise<void>[] = []

      zip.forEach((relativePath, zipEntry) => {
        // Skip directories and the chat file itself
        if (!zipEntry.dir && relativePath !== chatFileName) {
          attachmentPromises.push(
            (async () => {
              try {
                const blob = await zipEntry.async('blob')
                const blobUrl = URL.createObjectURL(blob)
                attachments[zipEntry.name] = blobUrl // Store filename -> blobUrl
              } catch (blobError) {
                console.error(`Error processing attachment ${zipEntry.name}:`, blobError)
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
      processZipFile(file)
    } else {
      clearData()
      setProcessingError('Unsupported file type. Use .txt or .zip.')
      setIsLoading(false)
    }
  }, [])

  // --- Handler for Text Paste ---
  const handleTextPasted = useCallback((text: string) => {
    clearData()
    setIsLoading(true)
    if (checkTextFormat(text)) {
      // Set data with empty attachments for pasted text
      setProcessedData({ chatText: text, attachments: {} })
      setProcessingError(null)
    } else {
      setProcessingError('Pasted text appears empty or invalid.')
      setProcessedData(null)
    }
    setIsLoading(false)
  }, [])

  // --- Function to Reset State ---
  const resetView = () => {
    clearData()
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
