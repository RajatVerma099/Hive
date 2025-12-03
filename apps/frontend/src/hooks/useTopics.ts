import { useState, useCallback } from 'react';

interface UseTopicsOptions {
  maxLength?: number;
  maxTopics?: number;
}

export const useTopics = (initialTopics: string[] = [], options: UseTopicsOptions = {}) => {
  const { maxLength = 50, maxTopics = 20 } = options;
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [topicInput, setTopicInput] = useState('');

  const addTopic = useCallback((topic: string) => {
    const trimmedTopic = topic.trim().toLowerCase();
    
    if (!trimmedTopic) return false;
    if (trimmedTopic.length > maxLength) return false;
    if (topics.includes(trimmedTopic)) return false;
    if (topics.length >= maxTopics) return false;

    setTopics(prev => [...prev, trimmedTopic]);
    setTopicInput('');
    return true;
  }, [topics, maxLength, maxTopics]);

  const removeTopic = useCallback((topic: string) => {
    setTopics(prev => prev.filter(t => t !== topic));
  }, []);

  const handleTopicKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && topicInput.trim()) {
      e.preventDefault();
      addTopic(topicInput);
    }
  }, [topicInput, addTopic]);

  const resetTopics = useCallback((newTopics: string[] = []) => {
    setTopics(newTopics);
    setTopicInput('');
  }, []);

  return {
    topics,
    topicInput,
    setTopicInput,
    addTopic,
    removeTopic,
    handleTopicKeyPress,
    resetTopics,
    setTopics
  };
};

