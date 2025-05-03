import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Loader2, RefreshCcw } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import FileUploadArea from './FileUploadArea'

const checkFormat = (text: string): boolean => {
  return true
}

interface ChatViewProps {
  chatContent: string
  onReset: () => void
}
const ChatView: React.FC<ChatViewProps> = ({ chatContent, onReset }) => {
  return (
    <Card className="animate-in fade-in w-full duration-500">
      {' '}
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Chat View</CardTitle>
          <CardDescription>Displaying processed chat data.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="flex-shrink-0">
          <RefreshCcw className="mr-2 h-4 w-4" /> Load New Chat
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted max-h-[70vh] overflow-auto rounded-md p-4 text-sm break-words whitespace-pre-wrap">
          {chatContent}
        </pre>
      </CardContent>
    </Card>
  )
}

const ChatProcessor: React.FC = () => {
  const [chatContent, setChatContent] = useState<string | null>(null)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showChatView, setShowChatView] = useState<boolean>(false)

  useEffect(() => {
    if (chatContent && !isLoading) {
      setShowChatView(true)
    } else {
      setShowChatView(false)
    }
  }, [chatContent, isLoading])

  // Handlers (handleFileSelected, handleTextPasted, processChatText) - remain largely the same
  // Ensure they clear chatContent before starting and set isLoading appropriately
  const handleFileSelected = useCallback((file: File) => {
    setProcessingError(null)
    setChatContent(null)
    setShowChatView(false)

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setProcessingError('Please upload a .txt file for now.')
      return
    }
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = event => {
      const text = event.target?.result as string
      if (text) processChatText(text)
      else {
        setProcessingError('Could not read file content.')
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      setProcessingError('Error reading file.')
      setIsLoading(false)
    }
    reader.readAsText(file)
  }, [])

  const handleTextPasted = useCallback((text: string) => {
    setProcessingError(null)
    setChatContent(null)
    setShowChatView(false)
    setIsLoading(true)
    processChatText(text)
  }, [])

  const processChatText = (text: string) => {
    // Using setTimeout to ensure isLoading state update renders before blocking check
    setTimeout(() => {
      const isValidFormat = checkFormat(text)
      if (isValidFormat) {
        setChatContent(text)
        setProcessingError(null)
      } else {
        setProcessingError('The provided text does not appear to be a valid WhatsApp chat export.')
        setChatContent(null)
      }
      setIsLoading(false) // Set loading false *after* processing
    }, 10) // Short delay
  }

  const resetView = () => {
    setChatContent(null)
    setProcessingError(null)
    setIsLoading(false)
    setShowChatView(false) // Explicitly hide chat view
  }

  // Determine container classes based on state
  const containerMaxWidth = showChatView ? 'max-w-4xl' : 'max-w-lg'

  return (
    // This outer div controls the max-width and centering
    <div
      className={cn(
        'mx-auto w-full transition-[max-width] duration-500 ease-in-out',
        containerMaxWidth
      )}
    >
      {isLoading && (
        <Card className="animate-in fade-in w-full text-center duration-300">
          <CardHeader>
            <CardTitle>Processing...</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      )}

      {!isLoading && showChatView && chatContent && (
        <ChatView chatContent={chatContent} onReset={resetView} />
      )}

      {!isLoading && !showChatView && (
        // Add fade-in animation when returning to the upload view too
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
