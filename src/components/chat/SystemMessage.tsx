import type { SystemMessage as SystemMessageType } from '@/types/messages'
import React from 'react'

interface SystemMessageProps {
  message: SystemMessageType
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  return (
    <div className="my-2 flex justify-center">
      <div className="bg-muted/70 max-w-[80%] rounded-lg px-4 py-1 text-center text-xs">
        {message.text}
      </div>
    </div>
  )
}

export default SystemMessage
