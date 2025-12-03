import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';
import { useModal } from '../hooks/useModal';
import { useTopics } from '../hooks/useTopics';
import { calculateDurationFromExpiry, calculateExpiryFromDuration } from '../utils/fadeUtils';
import type { Fade } from '../types';
import { Sparkles, Edit, Trash2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { FormInput } from './ui/FormInput';
import { FormTextarea } from './ui/FormTextarea';
import { TopicInput } from './forms/TopicInput';

interface CreateFadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFadeCreated?: (fade: any) => void;
  fade?: Fade | null;
  onDeleted?: () => void;
}

type ExpiryType = 'duration' | 'datetime';

export const CreateFadeModal: React.FC<CreateFadeModalProps> = ({ 
  isOpen, 
  onClose,
  onFadeCreated,
  fade,
  onDeleted
}) => {
  const { dispatch } = useApp();
  const { renderPortal } = useModal(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Fade-specific fields
  const [expiryType, setExpiryType] = useState<ExpiryType>('duration');
  const [duration, setDuration] = useState({ hours: 1, minutes: 0 });
  const [expiryDateTime, setExpiryDateTime] = useState('');
  
  const {
    topics,
    topicInput,
    setTopicInput,
    handleTopicKeyPress,
    removeTopic,
    resetTopics
  } = useTopics();
  
  const isEditMode = !!fade;

  // Pre-fill form when editing
  useEffect(() => {
    if (fade && isOpen) {
      setName(fade.name || '');
      setDescription(fade.description || '');
      resetTopics(fade.topics || []);
      
      // For edit mode, calculate remaining time from current expiry
      const { hours, minutes } = calculateDurationFromExpiry(fade.expiresAt);
      setDuration({ hours, minutes });
      setExpiryType('duration');
      
      // Set datetime to the current expiry date
      const now = new Date();
      const expiryDate = new Date(fade.expiresAt);
      const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (expiryDate <= maxDate) {
        setExpiryDateTime(expiryDate.toISOString().slice(0, 16));
      }
    } else if (!fade && isOpen) {
      // Reset form when creating new
      setName('');
      setDescription('');
      resetTopics([]);
      setDuration({ hours: 1, minutes: 0 });
      setExpiryDateTime('');
      setExpiryType('duration');
    }
  }, [fade, isOpen, resetTopics]);

  const calculateExpiryTimestamp = (): Date => {
    const now = new Date();
    
    if (expiryType === 'duration') {
      const baseTime = isEditMode && fade 
        ? (new Date(fade.expiresAt) > now ? new Date(fade.expiresAt) : now)
        : now;
      const expiry = calculateExpiryFromDuration(duration.hours, duration.minutes);
      // Adjust to start from baseTime instead of now
      const diff = expiry.getTime() - now.getTime();
      return new Date(baseTime.getTime() + diff);
    } else {
      return new Date(expiryDateTime);
    }
  };

  const validateExpiry = (expiryDate: Date): boolean => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return expiryDate > now && expiryDate <= oneWeekFromNow;
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

      // Validate fade-specific fields
      if (expiryType === 'duration') {
        const totalMinutes = duration.hours * 60 + duration.minutes;
        if (totalMinutes <= 0) {
          throw new Error('Duration must be greater than 0');
        }
        if (totalMinutes > 7 * 24 * 60) { // 1 week in minutes
          throw new Error('Duration cannot exceed 1 week');
        }
      } else {
        if (!expiryDateTime) {
          throw new Error('Expiry date and time is required');
        }
      }
      
      const expiryDate = calculateExpiryTimestamp();
      if (!validateExpiry(expiryDate)) {
        throw new Error('Expiry must be between now and 1 week from now');
      }

      if (isEditMode && fade) {
        // Update existing fade
        const response = await apiService.updateFade(fade.id, {
          name: name.trim(),
          description: description.trim() || null,
          topics,
          expiresAt: expiryDate.toISOString()
        });

        // Update the app state
        dispatch({ type: 'UPDATE_FADE', payload: response as any });
      } else {
        // Create new fade
        const response = await apiService.createFade({
          name: name.trim(),
          description: description.trim() || null,
          topics,
          expiresAt: expiryDate.toISOString()
        });

        // Update the app state
        dispatch({ type: 'ADD_FADE', payload: response as any });

        // Call callback to open the fade if provided
        if (onFadeCreated) {
          onFadeCreated(response);
        }
      }

      // Reset form
      setName('');
      setDescription('');
      setTopics([]);
      setTopicInput('');
      setDuration({ hours: 1, minutes: 0 });
      setExpiryDateTime('');

      onClose();
    } catch (error: any) {
      setError(error.message || (isEditMode ? 'Failed to update fade' : 'Failed to create fade'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !fade) return;
    
    if (!window.confirm('Are you sure you want to delete this fade? This action cannot be undone.')) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await apiService.deleteFade(fade.id);
      
      // Update the app state
      dispatch({ type: 'REMOVE_FADE', payload: fade.id });
      
      // Call onDeleted callback if provided
      if (onDeleted) {
        onDeleted();
      }
      
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to delete fade');
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
      setDuration({ hours: 1, minutes: 0 });
      setExpiryDateTime('');
      setError(null);
      onClose();
    }
  };

  return renderPortal(
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Fade' : 'Create New Fade'}
      subtitle={isEditMode ? 'Update fade details and extend expiry' : 'Create a temporary conversation that will expire'}
      icon={isEditMode ? <Edit className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
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
          label="Fade Name *"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter fade name"
          required
        />

        {/* Topics */}
        <TopicInput
          topics={topics}
          topicInput={topicInput}
          onTopicInputChange={setTopicInput}
          onTopicKeyPress={handleTopicKeyPress}
          onRemoveTopic={removeTopic}
          variant="fade"
        />

        {/* Description */}
        <FormTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this fade"
          rows={3}
        />

          {/* Expiry fields */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {isEditMode ? 'Extend Expiry *' : 'Expiry *'}
              </label>
              {isEditMode && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-sm text-orange-800">
                    <Info className="w-4 h-4 inline mr-1" />
                    The new expiry will be calculated from the current time (or the current expiry date if it's in the future). 
                    The duration or date you specify will be added to extend the fade's lifetime.
                  </p>
                </div>
              )}
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="duration"
                    checked={expiryType === 'duration'}
                    onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Duration</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="datetime"
                    checked={expiryType === 'datetime'}
                    onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Date & Time</span>
                </label>
              </div>

              {expiryType === 'duration' ? (
                <div className="flex space-x-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="168"
                      value={duration.hours}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setDuration({ ...duration, hours: Math.min(Math.max(value, 0), 168) });
                      }}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={duration.minutes}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setDuration({ ...duration, minutes: Math.min(Math.max(value, 0), 59) });
                      }}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="datetime-local"
                  value={expiryDateTime}
                  onChange={(e) => setExpiryDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum expiry time is 1 week from now
              </p>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-orange-50 -mx-6 px-6 py-4">
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
                    <span>Delete Fade</span>
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
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 rounded-full hover:from-orange-700 hover:via-orange-800 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    {isEditMode ? <Edit className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isEditMode ? 'Update Fade' : 'Create Fade'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
  );
};

