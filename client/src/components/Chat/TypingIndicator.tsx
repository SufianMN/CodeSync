import { Participant } from '../../hooks/usePresence';

interface TypingIndicatorProps {
  participants: Participant[];
}

export function TypingIndicator({ participants }: TypingIndicatorProps) {
  const typingUsers = participants.filter((p) => p.typing && !p.idle);

  if (typingUsers.length === 0) return null;

  let text = '';
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].username} is typing...`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
  } else {
    text = 'Several people are typing...';
  }

  return <div className="px-4 py-2 text-xs text-gray-500 italic animate-pulse">{text}</div>;
}
