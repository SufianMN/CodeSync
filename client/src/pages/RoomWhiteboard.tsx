import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { RoomHeader } from '../components/RoomHeader/RoomHeader';
import { useAuth } from '../context/AuthContext';
import { useWhiteboardSync } from '../hooks/useWhiteboardSync';
import { useCollaboration } from '../hooks/useCollaboration';
import { getRoomById } from '../api/rooms';
import { ActivityBar } from '../components/Workspace/ActivityBar';

export function RoomWhiteboard() {
  const { id } = useParams<{ id: string }>();
  const roomId = id || '';
  const { user } = useAuth();

  const [roomName, setRoomName] = useState('Loading...');

  useEffect(() => {
    getRoomById(roomId)
      .then((room) => setRoomName(room.name))
      .catch(console.error);
  }, [roomId]);

  // Reuse the existing socket connection status hook
  const { status: connectionStatus } = useCollaboration(
    roomId,
    () => {},
    () => {},
  );

  const { store, isLoaded } = useWhiteboardSync(roomId);

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e]">
      <RoomHeader roomName={roomName} connectionStatus={connectionStatus} activeView="whiteboard" />

      <div className="flex flex-1 overflow-hidden relative">
        <ActivityBar activeView="whiteboard" />

        <div className="flex-1 relative w-full h-full overflow-hidden">
          {!isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#121212]">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-gray-400 font-medium animate-pulse">Loading whiteboard...</p>
              </div>
            </div>
          ) : (
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
                    user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                    colors.length;
                  editor.user.updateUserPreferences({
                    id: user.id,
                    name: user.name,
                    color: colors[colorIndex],
                  });
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
