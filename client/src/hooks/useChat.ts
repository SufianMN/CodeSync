import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket/socket';
import { getRoomMessages, ChatMessage } from '../api/chat';

export interface SystemMessage {
  id: string; // generated locally
  type: 'join' | 'leave';
  username: string;
  isSystem: true;
}

export type ChatItem = ChatMessage | SystemMessage;

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await getRoomMessages(roomId);
        if (mounted) {
          setMessages(history);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load chat history');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages (especially if sender receives it twice)
        if (prev.some((m) => 'id' in m && m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleSystemMessage = (payload: { type: 'join' | 'leave'; username: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}-${Math.random()}`,
          type: payload.type,
          username: payload.username,
          isSystem: true,
        },
      ]);
    };

    socket.on('chat:new', handleNewMessage);
    socket.on('system:message', handleSystemMessage);

    return () => {
      mounted = false;
      socket.off('chat:new', handleNewMessage);
      socket.off('system:message', handleSystemMessage);
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId || !socket.connected || !content.trim()) return;
      socket.emit('chat:send', { roomId, content: content.trim() });
    },
    [roomId],
  );

  return { messages, loading, error, sendMessage };
}
