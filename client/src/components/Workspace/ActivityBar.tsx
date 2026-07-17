import { Link, useParams } from 'react-router-dom';
import { Files, PenTool } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ActivityBarProps {
  activeView: 'code' | 'whiteboard';
}

export function ActivityBar({ activeView }: ActivityBarProps) {
  const { id: roomId } = useParams<{ id: string }>();

  return (
    <div className="w-12 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4 z-20">
      <Link
        to={`/room/${roomId}`}
        className={twMerge(
          'p-2 rounded-lg transition-colors group relative',
          activeView === 'code'
            ? 'text-white border-l-2 border-blue-500 rounded-l-none bg-gray-800/50'
            : 'text-gray-500 hover:text-gray-300',
        )}
        title="Explorer (Code)"
      >
        <Files className="w-6 h-6" strokeWidth={1.5} />
      </Link>

      <Link
        to={`/room/${roomId}/whiteboard`}
        className={twMerge(
          'p-2 rounded-lg transition-colors group relative',
          activeView === 'whiteboard'
            ? 'text-white border-l-2 border-purple-500 rounded-l-none bg-gray-800/50'
            : 'text-gray-500 hover:text-gray-300',
        )}
        title="Whiteboard"
      >
        <PenTool className="w-6 h-6" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
