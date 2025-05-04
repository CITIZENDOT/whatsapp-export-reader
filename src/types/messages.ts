// Define the base Message interface
export interface Message {
  sender: string;
  datetime: Date;
}

// TextMessage extends Message with text content
export interface TextMessage extends Message {
  type: 'text';
  text: string;
}

// AttachmentMessage extends Message with attachment content
export interface AttachmentMessage extends Message {
  type: 'attachment';
  fileName: string;
}

// SystemMessage for system notifications
export interface SystemMessage {
  type: 'system';
  datetime: Date;
  text: string;
}

// Union type for all message types
export type ChatMessage = TextMessage | AttachmentMessage | SystemMessage;

// Type guard functions
export const isTextMessage = (message: ChatMessage): message is TextMessage => 
  message.type === 'text';

export const isAttachmentMessage = (message: ChatMessage): message is AttachmentMessage => 
  message.type === 'attachment';

export const isSystemMessage = (message: ChatMessage): message is SystemMessage => 
  message.type === 'system';
