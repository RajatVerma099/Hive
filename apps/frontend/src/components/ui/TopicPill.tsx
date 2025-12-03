import React from 'react';
import { Hash, X } from 'lucide-react';

interface TopicPillProps {
  topic: string;
  onRemove: () => void;
  variant?: 'conversation' | 'fade';
}

export const TopicPill: React.FC<TopicPillProps> = ({ topic, onRemove, variant = 'conversation' }) => {
  const colorClasses = variant === 'fade'
    ? 'bg-gradient-to-r from-orange-500 to-red-600 border-orange-400'
    : 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${colorClasses} text-white rounded-full text-xs font-semibold shadow-lg border hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <Hash className="w-3 h-3" />
      {topic}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors duration-200"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

