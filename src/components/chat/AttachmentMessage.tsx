import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { getUserColor } from '@/utils/colorUtils'
import type { AttachmentMessage as AttachmentMessageType } from '@/types/messages'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, FileText } from 'lucide-react'

interface AttachmentMessageProps {
  message: AttachmentMessageType
  isCurrentUser: boolean
  formatTime: (date: Date) => string
  attachmentUrl?: string
  showSender?: boolean
}

const AttachmentMessage: React.FC<AttachmentMessageProps> = ({ 
  message, 
  isCurrentUser, 
  formatTime,
  attachmentUrl,
  showSender = true
}) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const userColor = !isCurrentUser ? getUserColor(message.sender) : undefined
  
  // Check if the file is an image, video, or PDF based on extension
  const fileName = message.fileName.toLowerCase()
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(fileName)
  const isVideo = /\.(mp4|webm|ogg|mov|avi)$/.test(fileName)
  const isPdf = /\.pdf$/.test(fileName)
  const isPreviewable = (isImage || isVideo || isPdf) && attachmentUrl

  return (
    <>
      <div 
        className={cn(
          "flex mb-2",
          isCurrentUser ? "justify-end" : "justify-start"
        )}
      >
        <div 
          className={cn(
            "rounded-lg px-3 py-2 max-w-[75%] shadow-sm",
            isCurrentUser 
              ? "bg-[#D9FDD3] dark:bg-[#005C4B] rounded-tr-none" 
              : "bg-muted rounded-tl-none"
          )}
        >
          {!isCurrentUser && showSender && (
            <div className="mb-1 text-xs font-medium" style={{ color: userColor }}>
              {message.sender}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {isPreviewable ? (
              <div 
                className="cursor-pointer" 
                onClick={() => setPreviewOpen(true)}
              >
                {isImage && (
                  <img 
                    src={attachmentUrl} 
                    alt={message.fileName}
                    className="max-h-[200px] max-w-full rounded object-contain"
                  />
                )}
                {isVideo && (
                  <video 
                    src={attachmentUrl}
                    className="max-h-[200px] max-w-full rounded object-contain"
                    controls={false}
                    muted
                    poster=""
                  />
                )}
                {isPdf && (
                  <div className="flex items-center gap-2 bg-background/10 p-2 rounded">
                    <FileText className="h-8 w-8 text-red-500" />
                    <span className="text-sm text-black dark:text-white">
                      {message.fileName}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-background/20 rounded p-1">
                  📎
                </div>
                <span className="text-sm text-black dark:text-white">
                  {attachmentUrl 
                    ? <a 
                        href={attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {message.fileName}
                      </a>
                    : message.fileName
                  }
                </span>
              </div>
            )}
            
            <div className="text-xs text-right text-[#667781] dark:text-white/60">
              {formatTime(message.datetime)}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {isPreviewable && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[80vw] max-h-[90vh] p-0 overflow-hidden bg-black/90">
            <button 
              onClick={() => setPreviewOpen(false)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 z-10"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center justify-center w-full h-full p-4">
              {isImage && (
                <img 
                  src={attachmentUrl} 
                  alt={message.fileName}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              )}
              {isVideo && (
                <video 
                  src={attachmentUrl}
                  className="max-h-[80vh] max-w-full object-contain"
                  controls
                  autoPlay
                />
              )}
              {isPdf && (
                <iframe
                  src={`${attachmentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-[80vh]"
                  title={message.fileName}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default AttachmentMessage
