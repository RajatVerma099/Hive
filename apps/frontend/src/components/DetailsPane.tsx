import React, { useState } from 'react';
import { X, Edit, Trash2, Share2, LogOut } from 'lucide-react';
import type { Conversation, Fade } from '../types';
import { formatDate } from '../utils/dateFormat';

interface DetailsPaneProps<T extends Conversation | Fade> {
  item: T | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (item: T, e: React.MouseEvent) => void;
  onDelete?: (item: T, e: React.MouseEvent) => void;
  onShare?: (item: T, e: React.MouseEvent) => void;
  onLeave?: (item: T, e: React.MouseEvent) => void;
  currentUserId?: string;
  showExpiry?: boolean;
  itemType: 'conversation' | 'fade';
}

export const DetailsPane = <T extends Conversation | Fade>({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onShare,
  onLeave,
  currentUserId,
  showExpiry = false,
  itemType,
}: DetailsPaneProps<T>) => {
  const [showAllTags, setShowAllTags] = useState(false);

  if (!isOpen || !item) return null;

  const isCreator = currentUserId === item.creatorId;
  const typeLabel = itemType === 'conversation' ? 'Conversation' : 'Fade';

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 rounded-l-xl z-10 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {item.description && (
          <div>
            <p className="text-sm text-gray-900">{item.description}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{item.participants?.length || 0}</span>{' '}
            {item.participants?.length === 1 ? 'Participant' : 'Participants'}
          </p>
        </div>
        
        {item.creator && (
          <div>
            <p className="text-sm text-gray-700">
              Created by{' '}
              <span className="font-medium">{item.creator.name}</span>
              {item.creator.avatar && (
                <img
                  src={item.creator.avatar}
                  alt={item.creator.name}
                  className="w-5 h-5 rounded-full inline-block ml-1.5 align-middle"
                />
              )}
              {' '}on {formatDate(item.createdAt)}
            </p>
          </div>
        )}
        
        {showExpiry && 'expiresAt' in item && (
          <div className="pt-4 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Expires</h4>
              <p className="text-2xl font-semibold text-gray-900 mb-1">
                {formatDate(item.expiresAt, true)}
              </p>
            </div>
          </div>
        )}
        
        {item.topics && item.topics.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? item.topics : item.topics.slice(0, 5)).map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {topic}
                </span>
              ))}
              {!showAllTags && item.topics.length > 5 && (
                <button
                  onClick={() => setShowAllTags(true)}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                >
                  +{item.topics.length - 5} more
                </button>
              )}
              {showAllTags && (
                <button
                  onClick={() => setShowAllTags(false)}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          {isCreator && onEdit && (
            <>
              <button
                onClick={(e) => {
                  onEdit(item, e);
                  onClose();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Edit size={16} />
                <span>Edit {typeLabel}</span>
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    onDelete(item, e);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete {typeLabel}</span>
                </button>
              )}
            </>
          )}
          {onShare && (
            <button
              onClick={(e) => {
                onShare(item, e);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Share2 size={16} />
              <span>Share {typeLabel}</span>
            </button>
          )}
          {!isCreator && onLeave && (
            <button
              onClick={(e) => {
                onLeave(item, e);
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-full hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              <span>Leave {typeLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
