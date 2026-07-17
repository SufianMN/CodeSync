import { X, Clock, HardDrive, TerminalSquare, AlertCircle } from 'lucide-react';
import { ExecuteResponse } from '../../api/execute';

interface ExecutionConsoleProps {
  result: ExecuteResponse | null;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  error: string | null;
}

export function ExecutionConsole({
  result,
  isLoading,
  isOpen,
  setIsOpen,
  error,
}: ExecutionConsoleProps) {
  if (!isOpen) return null;

  return (
    <div className="border-t border-gray-800 bg-gray-900 text-white flex flex-col h-64 flex-shrink-0 relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#1e1e1e]">
        <div className="flex items-center space-x-2">
          <TerminalSquare className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-gray-300">Console</span>
        </div>
        <div className="flex items-center space-x-4">
          {result && !isLoading && (
            <>
              <div className="flex items-center space-x-1 text-xs text-gray-400" title="Runtime">
                <Clock className="h-3 w-3" />
                <span>{result.runtime} ms</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-400" title="Memory">
                <HardDrive className="h-3 w-3" />
                <span>{result.memory} MB</span>
              </div>
              <div
                className={`text-xs font-semibold px-2 py-0.5 rounded ${result.success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}
                title="Exit Code"
              >
                Exit: {result.exitCode}
              </div>
            </>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-300 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#0d0d0d]">
        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            <span>Running...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {result.stdout && (
              <div>
                <div className="text-xs text-gray-500 mb-1 select-none">STDOUT</div>
                <pre className="text-gray-300 whitespace-pre-wrap break-all">{result.stdout}</pre>
              </div>
            )}
            {result.stderr && (
              <div>
                <div className="text-xs text-red-900/50 mb-1 select-none font-bold text-red-500">
                  STDERR
                </div>
                <pre className="text-red-400 whitespace-pre-wrap break-all">{result.stderr}</pre>
              </div>
            )}
            {!result.stdout && !result.stderr && (
              <div className="text-gray-500 italic">Program finished with no output.</div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 italic">Click Run to execute your code.</div>
        )}
      </div>
    </div>
  );
}
