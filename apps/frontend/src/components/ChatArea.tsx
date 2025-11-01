import React, { useRef, useEffect } from 'react';
import { Info, MessageCircle } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { Conversation, Fade, Message, FadeMessage, User } from '../types';

interface ChatAreaProps {
  item: Conversation | Fade | null;
  messages: (Message | FadeMessage)[];
  currentUser: User | null;
  isLoadingMessages: boolean;
  pendingMessages: Set<string>;
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onInfoClick: () => void;
  showExpiryBadge?: boolean;
  getExpiryBadge?: () => React.ReactNode;
  itemType: 'conversation' | 'fade';
  typingUsers?: Set<string>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  item,
  messages,
  currentUser,
  isLoadingMessages,
  pendingMessages,
  newMessage,
  onMessageChange,
  onSendMessage,
  onInfoClick,
  showExpiryBadge = false,
  getExpiryBadge,
  itemType,
  typingUsers,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a {itemType}
          </h3>
          <p className="text-gray-500">
            Choose a {itemType} from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {item.name}
          </h3>
          <button
            onClick={onInfoClick}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-4"
            title="Show details"
          >
            <Info size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-1">
          <p className="text-sm text-gray-500">
            {item.participants?.length || 0} participants
          </p>
          {showExpiryBadge && getExpiryBadge?.()}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message) => {
              const isSent = message.userId === currentUser?.id;
              const isPending = pendingMessages.has(message.id);
              
              return (
                <div key={message.id} className="message-enter mb-0">
                  <MessageBubble
                    content={message.content}
                    timestamp={message.createdAt}
                    isSent={isSent}
                    isPending={isPending}
                    senderName={message.user?.name}
                    senderAvatar={message.user?.avatar}
                    showSenderInfo={!isSent}
                  />
                </div>
              );
            })}
            {/* Typing indicator */}
            {typingUsers && typingUsers.size > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 pt-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>Someone is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500">
                Be the first to send a message in this {itemType}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={onSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
};
