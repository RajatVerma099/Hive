import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';
import { useModal } from '../hooks/useModal';
import { useTopics } from '../hooks/useTopics';
import type { Conversation } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { FormInput } from './ui/FormInput';
import { FormTextarea } from './ui/FormTextarea';
import { TopicInput } from './forms/TopicInput';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation?: Conversation | null;
  onDeleted?: () => void;
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({ 
  isOpen, 
  onClose,
  conversation,
  onDeleted
}) => {
  const { dispatch } = useApp();
  const { renderPortal } = useModal(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultMute, setDefaultMute] = useState(false);
  
  const {
    topics,
    topicInput,
    setTopicInput,
    handleTopicKeyPress,
    removeTopic,
    resetTopics
  } = useTopics();
  
  const isEditMode = !!conversation;

  // Pre-fill form when editing
  useEffect(() => {
    if (conversation && isOpen) {
      setName(conversation.name || '');
      setDescription(conversation.description || '');
      resetTopics(conversation.topics || []);
      setDefaultMute(false);
    } else if (!conversation && isOpen) {
      // Reset form when creating new
      setName('');
      setDescription('');
      resetTopics([]);
      setDefaultMute(false);
    }
  }, [conversation, isOpen, resetTopics]);

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

      if (isEditMode && conversation) {
        // Update existing conversation
        const response = await apiService.updateConversation(conversation.id, {
          name: name.trim(),
          description: description.trim() || null,
          topics,
          visibility: conversation.visibility || 'PUBLIC'
        });

        // Update the app state
        dispatch({ type: 'UPDATE_CONVERSATION', payload: response as any });
      } else {
        // Create new conversation
        const response = await apiService.createConversation({
          name: name.trim(),
          description: description.trim() || null,
          topics,
          visibility: 'PUBLIC',
          defaultMute
        });

        // Update the app state
        dispatch({ type: 'ADD_CONVERSATION', payload: response as any });
      }

      // Reset form
      setName('');
      setDescription('');
      resetTopics([]);
      setDefaultMute(false);

      onClose();
    } catch (error: any) {
      setError(error.message || (isEditMode ? 'Failed to update conversation' : 'Failed to create conversation'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !conversation) return;
    
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await apiService.deleteConversation(conversation.id);
      
      // Update the app state
      dispatch({ type: 'REMOVE_CONVERSATION', payload: conversation.id });
      
      // Call onDeleted callback if provided
      if (onDeleted) {
        onDeleted();
      }
      
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to delete conversation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setName('');
      setDescription('');
      resetTopics([]);
      setDefaultMute(false);
      setError(null);
      onClose();
    }
  };

  return renderPortal(
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Conversation' : 'Create New Conversation'}
      subtitle={isEditMode ? 'Update conversation details' : 'Start a meaningful conversation with your community'}
      icon={isEditMode ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
      disabled={isSubmitting}
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <FormInput
          label="Conversation Name *"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter conversation name"
          required
        />

        {/* Topics */}
        <TopicInput
          topics={topics}
          topicInput={topicInput}
          onTopicInputChange={setTopicInput}
          onTopicKeyPress={handleTopicKeyPress}
          onRemoveTopic={removeTopic}
          variant="conversation"
        />

        {/* Description */}
        <FormTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this conversation"
          rows={3}
        />

          {/* Conversation-specific fields */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <input
                type="checkbox"
                checked={defaultMute}
                onChange={(e) => setDefaultMute(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                  Default mute for new participants
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  New participants will be muted by default when they join this conversation
                </p>
              </div>
            </label>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50 -mx-6 px-6 py-4">
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="px-5 py-2 text-sm font-semibold text-red-700 bg-white border-2 border-red-300 rounded-full hover:bg-red-50 hover:border-red-400 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Conversation</span>
                  </>
                )}
              </button>
            )}
            <div className="flex justify-end space-x-3 ml-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || isDeleting}
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting || !name.trim() || topics.length === 0}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-full hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    {isEditMode ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{isEditMode ? 'Update Conversation' : 'Create Conversation'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
  );
};
