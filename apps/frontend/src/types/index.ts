// User types
export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  googleId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Conversation types
export interface Conversation {
  id: string;
  name: string;
  description?: string;
  topics: string[];
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  defaultMute: boolean;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  isActive: boolean;
  creator?: User;
  participants?: ConversationParticipant[];
  messages?: Message[];
  pinnedMessages?: Message[];
}

// Fade (temporary conversation) types
export interface Fade {
  id: string;
  name: string;
  description?: string;
  topics: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  isActive: boolean;
  convertedToConversation: boolean;
  creator?: User;
  participants?: FadeParticipant[];
  messages?: FadeMessage[];
}

// Participant types
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'HOST' | 'CONVERSER' | 'SPECTATOR';
  joinedAt: string;
  isMuted: boolean;
  conversation?: Conversation;
  user?: User;
}

export interface FadeParticipant {
  id: string;
  fadeId: string;
  userId: string;
  role: 'HOST' | 'CONVERSER' | 'SPECTATOR';
  joinedAt: string;
  isMuted: boolean;
  fade?: Fade;
  user?: User;
}

// Message types
export interface Message {
  id: string;
  content: string;
  conversationId: string;
  userId: string;
  isPinned: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  createdAt: string;
  updatedAt: string;
  replyToId?: string;
  language?: string;
  conversation?: Conversation;
  user?: User;
  replyTo?: Message;
  replies?: Message[];
  pinnedInConversationId?: string;
  pinnedInConversation?: Conversation;
  savedBy?: Notebook[];
}

export interface FadeMessage {
  id: string;
  content: string;
  fadeId: string;
  userId: string;
  isPinned: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  createdAt: string;
  updatedAt: string;
  replyToId?: string;
  language?: string;
  fade?: Fade;
  user?: User;
  replyTo?: FadeMessage;
  replies?: FadeMessage[];
}

// Notebook types
export interface Notebook {
  id: string;
  userId: string;
  messageId: string;
  title?: string;
  createdAt: string;
  user?: User;
  message?: Message;
}

// Socket event types
export interface SocketEvents {
  'join-conversation': (conversationId: string) => void;
  'leave-conversation': (conversationId: string) => void;
  'send-message': (data: {
    conversationId: string;
    content: string;
    userId: string;
  }) => void;
  'typing': (data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
  'joined-conversation': (conversationId: string) => void;
  'left-conversation': (conversationId: string) => void;
  'new-message': (message: Message) => void;
  'user-typing': (data: {
    userId: string;
    isTyping: boolean;
  }) => void;
  'error': (error: string) => void;
}

// UI state types
export interface AppState {
  user: User | null;
  currentConversation: Conversation | null;
  conversations: Conversation[];
  fades: Fade[];
  notebook: Notebook[];
  isConnected: boolean;
  typingUsers: Set<string>;
}

// Tab types
export type TabType = 'chats' | 'discover' | 'notebook' | 'profile';

// Search filters
export interface SearchFilters {
  query: string;
  topics: string[];
  visibility: 'ALL' | 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  sortBy: 'recent' | 'popular' | 'alphabetical';
}
