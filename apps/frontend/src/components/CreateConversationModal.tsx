import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Hash, 
  Info, 
  Plus,
  X as CloseIcon
} from 'lucide-react';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TopicPillProps {
  topic: string;
  onRemove: () => void;
}

const TopicPill: React.FC<TopicPillProps> = ({ topic, onRemove }) => (
  <div className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg border border-blue-400 hover:shadow-xl transition-all duration-300 hover:scale-105">
    <Hash className="w-4 h-4" />
    {topic}
    <button
      onClick={onRemove}
      className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors duration-200"
    >
      <CloseIcon className="w-4 h-4" />
    </button>
  </div>
);

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { dispatch } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [defaultMute, setDefaultMute] = useState(false);

  const handleTopicKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && topicInput.trim()) {
      e.preventDefault();
      const newTopic = topicInput.trim().toLowerCase();
      if (!topics.includes(newTopic) && newTopic.length > 0 && newTopic.length <= 50) {
        setTopics([...topics, newTopic]);
        setTopicInput('');
      }
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate common fields
      if (!name.trim()) {
        throw new Error('Name is required');
      }
      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }
      if (topics.length === 0) {
        throw new Error('At least one topic is required');
      }

      const response = await apiService.createConversation({
        name: name.trim(),
        description: description.trim() || null,
        topics,
        visibility: 'PUBLIC',
        defaultMute
      });

      // Update the app state
      dispatch({ type: 'ADD_CONVERSATION', payload: response as any });

      // Reset form
      setName('');
      setDescription('');
      setTopics([]);
      setTopicInput('');
      setDefaultMute(false);

      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create conversation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setName('');
      setDescription('');
      setTopics([]);
      setTopicInput('');
      setDefaultMute(false);
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center animate-in fade-in duration-300" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999,
        margin: 0,
        padding: '1rem'
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-10 border-b border-gray-200/50 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Create New Conversation
              </h2>
              <p className="text-gray-600 mt-2 font-medium">
                Start a meaningful conversation with your community
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-2xl transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-900">
              Conversation Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter conversation name"
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400 text-lg font-medium shadow-sm hover:shadow-md"
              required
            />
          </div>

          {/* Topics */}
          <div className="space-y-4">
            <label className="block text-lg font-bold text-gray-900">
              Topics *
              <span className="ml-3 text-gray-400" title="Keywords that help make this discoverable">
                <Info className="w-5 h-5 inline" />
              </span>
            </label>
            <div className="space-y-4">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={handleTopicKeyPress}
                placeholder="Type a topic and press Enter (max 50 chars)"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400 text-lg font-medium shadow-sm hover:shadow-md"
              />
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {topics.map((topic, index) => (
                    <TopicPill
                      key={index}
                      topic={topic}
                      onRemove={() => removeTopic(topic)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-900">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this conversation"
              rows={4}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400 text-lg font-medium shadow-sm hover:shadow-md resize-none"
            />
          </div>

          {/* Conversation-specific fields */}
          <div className="space-y-3">
            <label className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <input
                type="checkbox"
                checked={defaultMute}
                onChange={(e) => setDefaultMute(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-4 transition-all duration-200"
              />
              <div>
                <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                  Default mute for new participants
                </span>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  New participants will be muted by default when they join this conversation
                </p>
              </div>
            </label>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end space-x-6 pt-12 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50 -mx-10 px-10 py-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-8 py-4 text-lg font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || topics.length === 0}
              className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create Conversation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
