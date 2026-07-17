import { ChatItem, SystemMessage } from '../../hooks/useChat';
import { Participant } from '../../hooks/usePresence';
import { socket } from '../../socket/socket';

interface MessageBubbleProps {
  item: ChatItem;
  participants: Participant[];
}

export function MessageBubble({ item, participants }: MessageBubbleProps) {
  if ('isSystem' in item) {
    const sysItem = item as SystemMessage;
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs italic text-gray-500">
          {sysItem.username} {sysItem.type === 'join' ? 'joined' : 'left'} the room
        </span>
      </div>
    );
  }

  const isMe =
    item.userId === socket.id ||
    participants.find((p) => p.socketId === socket.id)?.userId === item.userId;
  const time = new Date(item.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Simple @mention highlighting
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const participant = participants.find((p) => p.username === username);
        if (participant) {
          return (
            <span key={i} className="font-semibold" style={{ color: participant.color }}>
              {part}
            </span>
          );
        }
        return (
          <span key={i} className="text-blue-400 font-semibold">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="flex items-baseline space-x-2 mb-1">
        <span className="text-xs font-medium text-gray-400">{isMe ? 'You' : item.username}</span>
        <span className="text-[10px] text-gray-600">{time}</span>
      </div>
      <div
        className={`px-3 py-2 rounded-lg max-w-[90%] break-words text-sm ${
          isMe
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'
        }`}
      >
        {renderContent(item.content)}
      </div>
    </div>
  );
}
