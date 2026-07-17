import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Share2, Minus, Plus, Settings, Check, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import { SaveState } from '../../hooks/useAutosave';
import { ConnectionStatus } from '../../hooks/useCollaboration';
import { RunButton } from '../Execution/RunButton';

interface RoomHeaderProps {
  roomName: string;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  saveState?: SaveState;
  connectionStatus: ConnectionStatus;
  onRun?: () => void;
  isRunning?: boolean;
  editorSettings?: any;
  updateSetting?: (key: string, value: any) => void;
  resetLayout?: () => void;
  activeView?: 'code' | 'whiteboard';
}

const LANGUAGES = [
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
];

export function RoomHeader({
  roomName,
  language,
  onLanguageChange,
  saveState,
  connectionStatus,
  onRun,
  isRunning,
  editorSettings,
  updateSetting,
  resetLayout,
  activeView = 'code',
}: RoomHeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

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
          {activeView === 'code' ? (
            <Code2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
          ) : (
            <PenTool className="h-5 w-5 text-purple-500 flex-shrink-0" />
          )}
          <h1 className="font-semibold text-white truncate" title={roomName}>
            {roomName}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-end sm:space-x-4">
        {activeView === 'code' && (
          <>
            {onLanguageChange && language !== undefined && (
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
            )}

            {onRun && isRunning !== undefined && <RunButton onRun={onRun} isLoading={isRunning} />}

            {updateSetting && editorSettings && (
              <>
                {/* Font Size Controls */}
                <div className="flex items-center rounded bg-gray-800 text-gray-300 text-sm font-medium border border-gray-700 overflow-hidden">
                  <button
                    onClick={() =>
                      updateSetting('fontSize', Math.max(10, editorSettings.fontSize - 1))
                    }
                    className="px-2 py-1.5 hover:bg-gray-700 hover:text-white transition"
                    title="Decrease Font Size (Ctrl+-)"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-2 w-8 text-center">{editorSettings.fontSize}</span>
                  <button
                    onClick={() =>
                      updateSetting('fontSize', Math.min(24, editorSettings.fontSize + 1))
                    }
                    className="px-2 py-1.5 hover:bg-gray-700 hover:text-white transition"
                    title="Increase Font Size (Ctrl++)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Settings Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center space-x-1 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Editor</span>
                  </button>

                  {showSettings && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-700 bg-gray-900 shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Theme
                      </div>
                      <div className="px-4 py-1">
                        <select
                          value={editorSettings.theme}
                          onChange={(e) => updateSetting('theme', e.target.value)}
                          className="w-full rounded border border-gray-700 bg-gray-800 p-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="vs-dark">VS Dark</option>
                          <option value="vs">VS Light</option>
                          <option value="hc-black">High Contrast</option>
                        </select>
                      </div>

                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                        Preferences
                      </div>
                      {[
                        { key: 'minimap', label: 'Minimap' },
                        { key: 'wordWrap', label: 'Word Wrap' },
                        { key: 'lineNumbers', label: 'Line Numbers' },
                        { key: 'highlightActiveLine', label: 'Highlight Active Line' },
                        { key: 'autoSave', label: 'Auto Save' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => updateSetting(opt.key, !editorSettings[opt.key])}
                          className="w-full flex items-center justify-between px-4 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                          <span>{opt.label}</span>
                          {editorSettings[opt.key] && <Check className="h-4 w-4 text-blue-500" />}
                        </button>
                      ))}
                      <div className="border-t border-gray-800 mt-2 pt-2">
                        <button
                          onClick={() => {
                            if (resetLayout) resetLayout();
                            setShowSettings(false);
                          }}
                          className="w-full flex items-center px-4 py-1.5 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300"
                        >
                          Reset Layout & Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

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
