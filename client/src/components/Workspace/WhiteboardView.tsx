import { useAuth } from '../../context/AuthContext';
import { useWhiteboardSync } from '../../hooks/useWhiteboardSync';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

interface WhiteboardViewProps {
  roomId: string;
}

export function WhiteboardView({ roomId }: WhiteboardViewProps) {
  const { user } = useAuth();
  const { store, isLoaded } = useWhiteboardSync(roomId);

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-400 font-medium animate-pulse">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ isolation: 'isolate' }}>
      <Tldraw
        store={store}
        onMount={(editor) => {
          if (user) {
            const colors = [
              '#f87171',
              '#fb923c',
              '#fbbf24',
              '#a3e635',
              '#34d399',
              '#2dd4bf',
              '#38bdf8',
              '#818cf8',
              '#c084fc',
              '#f472b6',
            ];
            const colorIndex =
              user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
            editor.user.updateUserPreferences({
              id: user.id,
              name: user.name,
              color: colors[colorIndex],
            });
          }
        }}
      />
    </div>
  );
}
