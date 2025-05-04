import type { ChatMessage } from '@/types/messages'
import { isAttachmentMessage, isSystemMessage, isTextMessage } from '@/types/messages'
import React from 'react'
import AttachmentMessage from './AttachmentMessage'
import DateDivider from './DateDivider'
import SystemMessage from './SystemMessage'
import TextMessage from './TextMessage'

interface MessageGroupProps {
  date: string
  messages: ChatMessage[]
  primaryUser: string
  formatTime: (date: Date) => string
  attachments: Record<string, string>
}

const MessageGroup: React.FC<MessageGroupProps> = ({
  date,
  messages,
  primaryUser,
  formatTime,
  attachments,
}) => {
  let previousSender: string | null = null

  const renderMessage = (message: ChatMessage, index: number) => {
    if (isSystemMessage(message)) {
      // Reset previous sender for system messages
      previousSender = null
      return <SystemMessage key={index} message={message} />
    }

    const isCurrentUser = 'sender' in message && message.sender === primaryUser

    // Check if this message is from the same sender as the previous one
    const showSender = !('sender' in message) || previousSender !== message.sender

    // Update previous sender for next message
    if ('sender' in message) {
      previousSender = message.sender
    }

    if (isTextMessage(message)) {
      return (
        <TextMessage
          key={index}
          message={message}
          isCurrentUser={isCurrentUser}
          formatTime={formatTime}
          showSender={showSender}
        />
      )
    }

    if (isAttachmentMessage(message)) {
      return (
        <AttachmentMessage
          key={index}
          message={message}
          isCurrentUser={isCurrentUser}
          formatTime={formatTime}
          attachmentUrl={attachments[message.fileName]}
          showSender={showSender}
        />
      )
    }

    return null
  }

  return (
    <div className="z-10 space-y-2">
      <DateDivider date={date} />
      {messages.map(renderMessage)}
    </div>
  )
}

export default MessageGroup
