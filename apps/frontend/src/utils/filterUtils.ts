import type { Conversation, Fade } from '../types';

export interface FilterableItem {
  name: string;
  description?: string;
  topics: string[];
}

export const filterItems = <T extends FilterableItem>(
  items: T[],
  searchQuery: string
): T[] => {
  if (!searchQuery.trim()) return items;
  
  const query = searchQuery.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query) ||
    item.topics.some(topic => topic.toLowerCase().includes(query))
  );
};

export const filterConversations = (conversations: Conversation[], searchQuery: string): Conversation[] => {
  return filterItems(conversations, searchQuery);
};

export const filterFades = (fades: Fade[], searchQuery: string): Fade[] => {
  return filterItems(fades, searchQuery);
};

