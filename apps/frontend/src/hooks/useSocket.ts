import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Define SocketEvents locally to avoid import issues
interface SocketEvents {
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
  'new-message': (message: any) => void;
  'user-typing': (data: {
    userId: string;
    isTyping: boolean;
  }) => void;
  'error': (error: string) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket<SocketEvents> | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      console.error('Connection error:', err);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-conversation', conversationId);
    }
  };

  const sendMessage = (data: {
    conversationId: string;
    content: string;
    userId: string;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', data);
    }
  };

  const sendTyping = (data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', data);
    }
  };

  const onEvent = <K extends keyof SocketEvents>(
    event: K,
    handler: SocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler as any);
    }
  };

  const offEvent = <K extends keyof SocketEvents>(
    event: K,
    handler: SocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler as any);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    onEvent,
    offEvent,
  };
};
