import { Users } from 'lucide-react';
import { Participant } from '../../hooks/usePresence';
import { socket } from '../../socket/socket';

interface ParticipantPanelProps {
  participants: Participant[];
}

export function ParticipantPanel({ participants }: ParticipantPanelProps) {
  return (
    <div className="w-64 flex-shrink-0 border-l border-gray-800 bg-gray-900 flex flex-col hidden lg:flex">
      <div className="flex items-center space-x-2 border-b border-gray-800 p-4">
        <Users className="h-5 w-5 text-gray-400" />
        <h2 className="font-semibold text-white">Participants ({participants.length})</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {participants.map((p) => {
          const isMe = p.socketId === socket.id;
          let statusText = 'Editing';
          if (p.idle) statusText = 'Idle';
          if (p.typing) statusText = 'Typing...';

          return (
            <div key={p.socketId} className="flex items-center space-x-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white relative"
                style={{ backgroundColor: p.color }}
              >
                {p.username.charAt(0).toUpperCase()}

                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-900 ${p.idle ? 'bg-yellow-400' : 'bg-green-400'}`}
                ></span>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-medium text-white">
                  {p.username} {isMe && <span className="text-gray-400 font-normal">(You)</span>}
                </span>
                <span
                  className={`truncate text-xs ${p.typing ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  {statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
