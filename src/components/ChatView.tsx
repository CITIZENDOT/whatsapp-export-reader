import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ChatMessage } from '@/types/messages'
import { extractUsers, parseWhatsAppChat } from '@/utils/chatParser'
import { Loader2, RefreshCcw } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import MessageGroup from './chat/MessageGroup'

// Define the structure for processed data
interface ProcessedChatData {
  chatText: string
  // Mapping from original attachment filename to its Blob URL
  attachments: Record<string, string>
}

interface ChatViewProps {
  data: ProcessedChatData
  onReset: () => void
}

const ChatView: React.FC<ChatViewProps> = ({ data, onReset }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [primaryUser, setPrimaryUser] = useState<string>('')
  const attachmentCount = Object.keys(data.attachments).length

  useEffect(() => {
    const strippedUnicode = data.chatText.replace(/\u200E/g, '').replace(/\u202F/g, ' ')
    const parsedMessages = parseWhatsAppChat(strippedUnicode)
    const chatUsers = extractUsers(parsedMessages)

    setMessages(parsedMessages)
    setUsers(chatUsers)

    // Set default primary user (first user in the list)
    if (chatUsers.length > 0 && !primaryUser) {
      setPrimaryUser(chatUsers[0])
    }

    setIsLoading(false)
  }, [data.chatText, primaryUser])

  const handleUserChange = (value: string) => {
    setPrimaryUser(value)
  }

  // Format date for display
  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date)
  }

  // Format date for message groups
  const formatMessageDay = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    let currentDate = ''
    let currentGroup: ChatMessage[] = []

    messages.forEach(message => {
      const messageDate = formatMessageDay(message.datetime)

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = messageDate
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }
    })

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup })
    }

    return groups
  }

  return (
    <Card className="animate-in fade-in w-full duration-500">
      <CardHeader className="grid grid-cols-2 gap-4 py-1">
        <div className="col-span-2 md:col-span-1">
          <CardTitle>WhatsApp Chat</CardTitle>
          <CardDescription className='mt-1'>
            Displaying {messages.length} messages with {users.length} participants.
            {attachmentCount > 0 && ` Found ${attachmentCount} attachment(s).`}
          </CardDescription>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-1.5 md:col-span-1">
          <div className="col-span-2 -mt-5 flex flex-col gap-1.5 md:col-span-1">
            <Label htmlFor="user-select" className="text-xs">
              View as
            </Label>
            <Select value={primaryUser} onValueChange={handleUserChange}>
              <SelectTrigger id="user-select" className="w-full">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="col-span-2 flex-shrink-0 md:col-span-1"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Load New Chat
          </Button>
        </div>
      </CardHeader>
      <CardContent className='px-3 md:px-6'>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="relative h-[70vh] overflow-y-auto rounded-lg border bg-[#EFEAE2] dark:bg-[#0B141A]">
            {/* Background pattern - use a pseudo-element with background-attachment: fixed */}

            <div className="relative flex flex-col space-y-4 p-2 md:p-4">
              <div
                className="pointer-events-none absolute inset-0 z-0 dark:invert-75"
                style={{
                  backgroundImage: 'url(/chat-bg.png)',
                  backgroundRepeat: 'repeat',
                  // backgroundSize: '210px auto',
                  backgroundAttachment: 'fixed',
                }}
              />

              {groupMessagesByDate().map((group, index) => (
                <MessageGroup
                  key={index}
                  date={group.date}
                  messages={group.messages}
                  primaryUser={primaryUser}
                  formatTime={formatMessageTime}
                  attachments={data.attachments}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ChatView
