import { Play, Square } from 'lucide-react';

interface RunButtonProps {
  onRun: () => void;
  isLoading: boolean;
}

export function RunButton({ onRun, isLoading }: RunButtonProps) {
  return (
    <button
      onClick={onRun}
      disabled={isLoading}
      className={`
        flex items-center space-x-1.5 rounded px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition
        ${
          isLoading
            ? 'bg-red-600 hover:bg-red-700 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 active:scale-95'
        }
      `}
      title={isLoading ? 'Execution in progress' : 'Run Code (Ctrl + Enter)'}
    >
      {isLoading ? (
        <>
          <Square className="h-4 w-4 fill-current" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Play className="h-4 w-4 fill-current" />
          <span>Run</span>
        </>
      )}
    </button>
  );
}
