import React, { useState, useEffect } from 'react';
import { Hash, Users, MoreVertical, Plus, Search, MessageCircle, Edit, Trash2, LogOut, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Conversation, Fade } from '../types';

interface ChatListPaneProps<T extends Conversation | Fade> {
  title: string;
  items: T[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentItem: T | null;
  onItemSelect: (item: T) => void;
  onEdit?: (item: T, e: React.MouseEvent) => void;
  onDelete?: (item: T, e: React.MouseEvent) => void;
  onShare?: (item: T, e: React.MouseEvent) => void;
  onLeave?: (item: T, e: React.MouseEvent) => void;
  onCreateClick: () => void;
  isLoading: boolean;
  error: string | null;
  emptyStateTitle: string;
  emptyStateMessage: string;
  currentUserId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  getExpiryBadge?: (item: T) => React.ReactNode;
  menuClassName?: string;
}

export const ChatListPane = <T extends Conversation | Fade>({
  title,
  items,
  searchQuery,
  onSearchChange,
  currentItem,
  onItemSelect,
  onEdit,
  onDelete,
  onShare,
  onLeave,
  onCreateClick,
  isLoading,
  error,
  emptyStateTitle,
  emptyStateMessage,
  currentUserId,
  isCollapsed,
  onToggleCollapse,
  getExpiryBadge,
  menuClassName = '',
}: ChatListPaneProps<T>) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${menuClassName}`)) {
        setMenuOpenId(null);
      }
    };

    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpenId, menuClassName]);

  return (
    <>
      <div 
        className={`bg-white flex flex-col transition-all duration-300 ease-in-out relative ${
          isCollapsed 
            ? 'w-1.5 bg-white/70 shadow-sm z-20' 
            : 'w-80 border-r border-gray-200 rounded-r-xl'
        }`}
      >
        {/* Header */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button 
                onClick={onCreateClick}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Plus size={20} className="text-gray-600" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* List */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-500">Loading {title.toLowerCase()}...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageCircle size={48} className="text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error loading {title.toLowerCase()}
                </h3>
                <p className="text-gray-500 max-w-md mb-4">
                  {error}
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageCircle size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {emptyStateTitle}
                </h3>
                <p className="text-gray-500 max-w-md">
                  {emptyStateMessage}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const maxVisibleTags = 2;
                const visibleTags = item.topics.slice(0, maxVisibleTags);
                const remainingTagsCount = item.topics.length - maxVisibleTags;
                const isCreator = currentUserId === item.creatorId;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => onItemSelect(item)}
                    className={`p-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      currentItem?.id === item.id ? 'bg-primary-50 border-primary-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center space-x-1.5 ${getExpiryBadge ? 'mb-0.5' : ''}`}>
                          <Hash size={14} className="text-gray-400 flex-shrink-0" />
                          <h3 className="font-medium text-gray-900 truncate text-sm">
                            {item.name}
                          </h3>
                          {getExpiryBadge && getExpiryBadge(item)}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Users size={11} />
                            <span>{item.participants?.length || 0}</span>
                          </div>
                          {item.topics.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <span>•</span>
                              <span>{item.topics.length} tags</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`relative ${menuClassName}`}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === item.id ? null : item.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <MoreVertical size={14} className="text-gray-400" />
                        </button>
                        {menuOpenId === item.id && (
                          <div className={`absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 ${menuClassName}`}>
                            {isCreator && onEdit && (
                              <>
                                <button
                                  onClick={(e) => {
                                    onEdit(item, e);
                                    setMenuOpenId(null);
                                  }}
                                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Edit size={16} />
                                  <span>Edit {title.slice(0, -1)}</span>
                                </button>
                                {onDelete && (
                                  <button
                                    onClick={(e) => {
                                      onDelete(item, e);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete {title.slice(0, -1)}</span>
                                  </button>
                                )}
                                <div className="border-t border-gray-200 my-1"></div>
                              </>
                            )}
                            {onShare && (
                              <button
                                onClick={(e) => {
                                  onShare(item, e);
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Share2 size={16} />
                                <span>Share {title.slice(0, -1)}</span>
                              </button>
                            )}
                            {!isCreator && onLeave && (
                              <button
                                onClick={(e) => {
                                  onLeave(item, e);
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <LogOut size={16} />
                                <span>Leave {title.slice(0, -1)}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Topics */}
                    {item.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {visibleTags.map((topic) => (
                          <span
                            key={topic}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                        {remainingTagsCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{remainingTagsCount} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Collapse/Expand Button */}
      <button
        onClick={onToggleCollapse}
        className={`absolute top-[104px] z-30 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-all duration-300 ${
          isCollapsed 
            ? 'left-1.5 -translate-x-1/2' 
            : 'left-80 -translate-x-1/2'
        }`}
        title={isCollapsed ? `Expand ${title.toLowerCase()}` : `Collapse ${title.toLowerCase()}`}
      >
        {isCollapsed ? (
          <ChevronRight size={16} className="text-gray-600" />
        ) : (
          <ChevronLeft size={16} className="text-gray-600" />
        )}
      </button>
    </>
  );
};
