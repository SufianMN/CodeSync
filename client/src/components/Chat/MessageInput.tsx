import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Send } from 'lucide-react';
import { socket } from '../../socket/socket';
import { debounce } from '../../utils/throttle';

interface MessageInputProps {
  roomId: string;
  onSend: (content: string) => void;
}

export function MessageInput({ roomId, onSend }: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleTypingStop = useRef(
    debounce(() => {
      if (socket.connected && roomId) {
        socket.emit('typing:stop', { roomId });
        typingRef.current = false;
      }
    }, 2000),
  ).current;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (socket.connected && roomId && !typingRef.current) {
      typingRef.current = true;
      socket.emit('typing:start', { roomId });
    }
    handleTypingStop();
  };

  const handleSend = () => {
    if (!content.trim()) return;
    onSend(content.trim());
    setContent('');

    // Stop typing immediately
    if (typingRef.current && socket.connected && roomId) {
      socket.emit('typing:stop', { roomId });
      typingRef.current = false;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-gray-900 border-t border-gray-800">
      <div className="relative flex items-end">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full bg-gray-800 text-white rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none max-h-[120px]"
          rows={1}
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className={`absolute right-2 bottom-2 p-1 rounded-md transition-colors ${
            content.trim() ? 'text-blue-500 hover:bg-gray-700' : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
