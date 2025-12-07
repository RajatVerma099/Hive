import React from 'react';
import { Loader2 } from 'lucide-react';
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
  // Pending messages stay aligned to the right (no left indentation)
  const alignmentClasses = isSent
    ? 'flex justify-end'
    : 'flex justify-start';

  const bubbleClasses = isSent && !isPending
    ? 'bg-primary-600 text-white rounded-xl'
    : isSent && isPending
    ? 'bg-transparent text-gray-700 rounded-xl border-2 border-dashed border-gray-400'
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
              <Loader2 size={10} className="text-gray-400 animate-spin ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
