import { cn } from '@/lib/utils'
import type { TextMessage as TextMessageType } from '@/types/messages'
import { getUserColor } from '@/utils/colorUtils'
import React from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TextMessageProps {
  message: TextMessageType
  isCurrentUser: boolean
  formatTime: (date: Date) => string
  showSender?: boolean
}

const TextMessage: React.FC<TextMessageProps> = ({
  message,
  isCurrentUser,
  formatTime,
  showSender = true,
}) => {
  const isLongMessage = message.text.length > 64
  const userColor = !isCurrentUser ? getUserColor(message.sender) : undefined

  // Pre-process the text to convert WhatsApp-style markdown
  // Convert single asterisks to double asterisks for bold
  const processText = (text: string): string => {
    // This regex finds text between single asterisks, but not if they're already double asterisks
    // It uses negative lookahead/lookbehind to avoid matching inside double asterisks
    return text.replace(/(?<!\*)\*(?!\*)(\S[^*]*?\S|\S)\*(?!\*)/g, '**$1**')
  }

  const processedText = processText(message.text)

  // Custom components to preserve whitespace
  const components: Components = {
    // Override the paragraph component to preserve whitespace
    p: ({ children }) => <div style={{ whiteSpace: 'pre-wrap' }}>{children}</div>,
    // Override the default text renderer to preserve whitespace
    text: ({ children }) => <span style={{ whiteSpace: 'pre-wrap' }}>{children}</span>,
    // Add link component to handle long URLs
    a: ({ node, href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="break-all text-[#0063CB] dark:text-[#53BDEB] underline"
      >
        {children}
      </a>
    ),
  }

  return (
    <div className={cn('mb-2 flex', isCurrentUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
          isCurrentUser
            ? 'rounded-tr-none bg-[#D9FDD3] dark:bg-[#005C4B]'
            : 'bg-muted rounded-tl-none'
        )}
      >
        {/* Sender name for non-current user */}
        {!isCurrentUser && showSender && (
          <div className="mb-1 text-xs font-medium" style={{ color: userColor }}>
            {message.sender}
          </div>
        )}

        {/* For long messages, use flex-col layout */}
        {isLongMessage ? (
          <div className="flex flex-col">
            <div className="break-words text-black dark:text-white">
              <div className="markdown whitespace-pre-wrap break-words overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {processedText}
                </ReactMarkdown>
              </div>
              {message.edited && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(edited)</span>
              )}
            </div>
            <div className="mt-1 text-right text-xs text-[#667781] dark:text-white/60">
              {formatTime(message.datetime)}
            </div>
          </div>
        ) : (
          /* For short messages, use flex-row layout with items-end */
          <div className={cn('flex items-end', isCurrentUser ? 'justify-end' : 'justify-start')}>
            <div className="break-words text-black dark:text-white">
              <div className="markdown whitespace-pre-wrap break-words overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {processedText}
                </ReactMarkdown>
              </div>
              {message.edited && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(edited)</span>
              )}
            </div>
            <div className="mb-0.5 ml-1.5 flex-shrink-0 text-xs text-[#667781] dark:text-white/60">
              {formatTime(message.datetime)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TextMessage
