import React from 'react';
import { formatTime } from '../utils/dateFormat';

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

  // For sent messages, align to right; for received, align to left
  // If pending, show with slight left indentation (shifted from right)
  const alignmentClasses = isSent && !isPending
    ? 'flex justify-end'
    : isSent && isPending
    ? 'flex justify-end mr-8' // Slight left indentation by adding right margin
    : 'flex justify-start';

  const bubbleClasses = isSent && !isPending
    ? 'bg-primary-600 text-white rounded-xl'
    : isSent && isPending
    ? 'bg-gray-300 text-gray-800 rounded-xl opacity-70'
    : 'bg-gray-100 text-gray-900 rounded-xl border border-gray-200';

  return (
    <div className={`${alignmentClasses} items-start`}>
      <div className={`max-w-[75%] ${isSent ? '' : 'flex flex-col'}`}>
        <div className={`px-1.5 py-0.5 ${bubbleClasses} relative`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
          
          {/* Inline metadata: Sender · Time */}
          <div className="flex items-center gap-1 mt-0.5">
            {!isSent && showSenderInfo && (
              <>
                <span className={`text-[10px] ${isSent ? 'text-white/80' : 'text-gray-500'}`}>
                  {senderName || 'Unknown User'}
                </span>
                <span className={`text-[10px] ${isSent ? 'text-white/60' : 'text-gray-400'}`}>
                  ·
                </span>
              </>
            )}
            <span className={`text-[10px] ${isSent && !isPending ? 'text-white/80' : 'text-gray-500'}`}>
              {formatTime(timestamp)}
            </span>
            {isPending && (
              <span className="text-[10px] text-gray-500">⏱</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
