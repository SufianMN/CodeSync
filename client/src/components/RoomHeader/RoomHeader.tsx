import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SaveState } from '../../hooks/useAutosave';
import { ConnectionStatus } from '../../hooks/useCollaboration';

interface RoomHeaderProps {
  roomName: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  saveState: SaveState;
  connectionStatus: ConnectionStatus;
}

const LANGUAGES = [
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export function RoomHeader({
  roomName,
  language,
  onLanguageChange,
  saveState,
  connectionStatus,
}: RoomHeaderProps) {
  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success('Room link copied!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 p-4 shadow-sm z-10">
      <div className="flex items-center space-x-4 flex-1 min-w-0 pr-4">
        <Link to="/dashboard" className="rounded p-1 hover:bg-gray-800 transition flex-shrink-0">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div className="flex items-center space-x-2 min-w-0">
          <Code2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <h1 className="font-semibold text-white truncate" title={roomName}>
            {roomName}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded border border-gray-700 bg-gray-800 p-1.5 text-sm font-medium text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleShare}
          className="flex items-center space-x-1 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition"
          title="Share Room"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-sm font-medium w-[120px]">
          <span
            className={`
              flex items-center space-x-1.5 transition-colors duration-300
              ${connectionStatus === 'Connected' ? 'text-green-400' : ''}
              ${connectionStatus === 'Connecting...' ? 'text-blue-400' : ''}
              ${connectionStatus === 'Disconnected' ? 'text-red-400' : ''}
            `}
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-current opacity-75 ${connectionStatus === 'Connecting...' ? 'animate-ping' : ''}`}
              ></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            <span className="w-24 truncate">{connectionStatus}</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-sm font-medium w-[130px]">
          <span
            className={`
              flex items-center space-x-1.5 transition-colors duration-300
              ${saveState === 'Saved' ? 'text-green-400' : ''}
              ${saveState === 'Saving...' ? 'text-blue-400' : ''}
              ${saveState === 'Unsaved Changes' ? 'text-yellow-400' : ''}
              ${saveState === 'Failed to save' ? 'text-red-400' : ''}
            `}
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-current opacity-75 ${saveState === 'Saving...' || saveState === 'Unsaved Changes' ? 'animate-ping' : ''}`}
              ></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            <span className="w-28 truncate">{saveState}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
