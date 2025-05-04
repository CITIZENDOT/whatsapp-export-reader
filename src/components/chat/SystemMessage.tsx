import React from 'react'
import type { SystemMessage as SystemMessageType } from '@/types/messages'

interface SystemMessageProps {
  message: SystemMessageType
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-center my-2">
      <div className="bg-muted/70 rounded-lg px-4 py-1 text-xs text-center max-w-[80%]">
        {message.text}
      </div>
    </div>
  )
}

export default SystemMessage