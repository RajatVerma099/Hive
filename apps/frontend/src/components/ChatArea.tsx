import React, { useRef, useEffect } from 'react';
import { Info, MessageCircle, Send } from 'lucide-react';
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevItemIdRef = useRef<string | null>(null);
  const prevLoadingRef = useRef<boolean>(false);

  // Auto-scroll to bottom when:
  // 1. Conversation/fade changes (item.id changes)
  // 2. Messages finish loading (isLoadingMessages goes from true to false)
  // 3. New messages are added (messages.length increases)
  useEffect(() => {
    const itemId = item?.id || null;
    const itemChanged = itemId !== prevItemIdRef.current;
    const loadingFinished = prevLoadingRef.current && !isLoadingMessages;
    
    // Update refs
    if (itemChanged) {
      prevItemIdRef.current = itemId;
    }
    prevLoadingRef.current = isLoadingMessages;

    // Scroll when:
    // - Item changes (switching conversations) - instant scroll
    // - Messages finish loading - instant scroll
    // - New messages added (and not loading) - smooth scroll
    if (messages.length > 0) {
      if (itemChanged || loadingFinished) {
        // Instant scroll when switching conversations or loading finishes
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 50);
      } else if (!isLoadingMessages) {
        // Smooth scroll for new messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      }
    }
  }, [messages.length, item?.id, isLoadingMessages]);

  // Helper function to format date label as "Sep 12, 1984"
  const formatDateLabel = (date: Date): string => {
    const messageDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    
    return messageDate.toLocaleDateString('en-US', options);
  };

  // Group messages with date separators
  const renderMessagesWithDateSeparators = () => {
    const elements: React.ReactNode[] = [];
    let lastDate: string | null = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      const dateKey = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`;
      
      // Add date separator if this is a new day
      if (lastDate !== dateKey) {
        elements.push(
          <div key={`date-${dateKey}`} className="flex items-center justify-center my-4">
            <div className="relative flex items-center w-full py-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="px-3 bg-white text-gray-600 text-xs font-medium">
                {formatDateLabel(messageDate)}
              </div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>
        );
        lastDate = dateKey;
      }

      // Add the message
      const isSent = message.userId === currentUser?.id;
      const isPending = pendingMessages.has(message.id);
      
      elements.push(
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
    });

    return elements;
  };

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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <>
            {renderMessagesWithDateSeparators()}
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
        <form onSubmit={onSendMessage} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Type a message..."
              className="w-full pl-4 pr-20 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-2 px-4 py-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-1.5"
              title="Send message"
            >
              <Send size={16} className="flex-shrink-0" />
              <span className="text-sm font-medium">Send</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
