import React from 'react';
import { Info } from 'lucide-react';
import { TopicPill } from '../ui/TopicPill';

interface TopicInputProps {
  topics: string[];
  topicInput: string;
  onTopicInputChange: (value: string) => void;
  onTopicKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTopic: (topic: string) => void;
  variant?: 'conversation' | 'fade';
  placeholder?: string;
}

export const TopicInput: React.FC<TopicInputProps> = ({
  topics,
  topicInput,
  onTopicInputChange,
  onTopicKeyPress,
  onRemoveTopic,
  variant = 'conversation',
  placeholder = 'Type a topic and press Enter (max 50 chars)'
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-900">
        Topics *
        <span className="ml-2 text-gray-400" title="Keywords that help make this discoverable">
          <Info className="w-4 h-4 inline" />
        </span>
      </label>
      <div className="space-y-2">
        <input
          type="text"
          value={topicInput}
          onChange={(e) => onTopicInputChange(e.target.value)}
          onKeyPress={onTopicKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400 text-sm shadow-sm hover:shadow-md"
        />
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <TopicPill
                key={index}
                topic={topic}
                onRemove={() => onRemoveTopic(topic)}
                variant={variant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

