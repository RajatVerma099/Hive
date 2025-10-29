import React from 'react';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isSent: boolean;
  isPending?: boolean;
  senderName?: string;
  senderAvatar?: string;
  showSenderInfo?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  timestamp,
  isSent,
  isPending = false,
  senderName,
  senderAvatar,
  showSenderInfo = false,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // For sent messages, align to right; for received, align to left
  // If pending, show with slight left indentation (shifted from right)
  const alignmentClasses = isSent && !isPending
    ? 'flex justify-end'
    : isSent && isPending
    ? 'flex justify-end mr-8' // Slight left indentation by adding right margin
    : 'flex justify-start';

  const bubbleClasses = isSent && !isPending
    ? 'bg-green-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm'
    : isSent && isPending
    ? 'bg-gray-300 text-gray-800 rounded-l-2xl rounded-tr-2xl rounded-br-sm opacity-70'
    : 'bg-gray-200 text-gray-900 rounded-r-2xl rounded-tl-2xl rounded-bl-sm';

  return (
    <div className={`${alignmentClasses} items-end`}>
      {/* Profile icon to the left (only for received messages) */}
      {!isSent && showSenderInfo && (
        <div className="flex-shrink-0 mr-2 mb-1">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700">
                {senderName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className={`max-w-[70%] ${isSent ? '' : 'flex flex-col'}`}>
        <div className={`px-2 py-1.5 ${bubbleClasses} relative`}>
          {/* Sender name inside bubble at top left (only for received messages) */}
          {!isSent && showSenderInfo && (
            <div className="mb-1">
              <span className={`text-xs font-semibold ${isSent ? 'text-white' : 'text-green-600'}`}>
                {senderName || 'Unknown User'}
              </span>
            </div>
          )}
          
          <p className={`text-sm whitespace-pre-wrap break-words ${!isSent && showSenderInfo ? 'mt-0.5' : ''}`}>
            {content}
          </p>
          
          <div className="flex items-center justify-end mt-0.5 space-x-1">
            <span className={`text-xs ${isSent && !isPending ? 'text-white opacity-90' : 'text-gray-500'}`}>
              {formatTime(timestamp)}
            </span>
            {isPending && (
              <span className="text-xs text-gray-500">⏱</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
