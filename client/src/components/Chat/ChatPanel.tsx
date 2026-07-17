import { useState, useRef, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { Participant } from '../../hooks/usePresence';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

interface ChatPanelProps {
  roomId: string;
  participants: Participant[];
}

export function ChatPanel({ roomId, participants }: ChatPanelProps) {
  const { messages, sendMessage } = useChat(roomId);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('chat_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    localStorage.setItem('chat_expanded', JSON.stringify(isExpanded));
    if (isExpanded) {
      setUnreadCount(0);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (!isExpanded) {
        // Only increment unread count if it's not a system message?
        // Actually, let's just increment for any new message.
        setUnreadCount((prev) => prev + (messages.length - prevMessagesLength.current));
      } else {
        // Auto-scroll logic if expanded
        const container = scrollRef.current;
        if (container) {
          // If we are near the bottom, scroll to bottom
          const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          if (isNearBottom) {
            setTimeout(() => {
              container.scrollTop = container.scrollHeight;
            }, 50);
          }
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isExpanded]);

  // Initial scroll to bottom when loading history
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isExpanded]);

  return (
    <div className="flex flex-col flex-1 min-h-0 border-l border-gray-800 bg-[#121212]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-white text-sm">
            Chat {unreadCount > 0 && !isExpanded && `(${unreadCount})`}
          </h2>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Body */}
      {isExpanded && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col space-y-1">
            {messages.map((item) => (
              <MessageBubble key={item.id} item={item} participants={participants} />
            ))}
          </div>

          <TypingIndicator participants={participants} />
          <MessageInput roomId={roomId} onSend={sendMessage} />
        </>
      )}
    </div>
  );
}
