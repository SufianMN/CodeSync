import { useState, useEffect, useRef } from 'react';
import { ExecuteResponse } from '../../api/execute';
import { Terminal, AlignLeft, AlertCircle, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ExecutionPanelProps {
  stdin: string;
  setStdin: (val: string) => void;
  result: ExecuteResponse | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ExecutionPanel({
  stdin,
  setStdin,
  result,
  isLoading,
  error,
  isOpen,
  setIsOpen,
}: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem('executionPanelHeight');
    return saved ? parseInt(saved, 10) : 300;
  });
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) {
      setActiveTab('output');
      setIsOpen(true);
    }
  }, [isLoading, setIsOpen]);

  useEffect(() => {
    localStorage.setItem('executionPanelHeight', height.toString());
  }, [height]);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging) return;

      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;

      // Min height 150px, Max height 60% of window
      if (newHeight >= 150 && newHeight <= windowHeight * 0.6) {
        setHeight(newHeight);
      } else if (newHeight < 150) {
        setHeight(150);
      } else if (newHeight > windowHeight * 0.6) {
        setHeight(windowHeight * 0.6);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) {
    return (
      <div
        className="bg-[#1e1e1e] border-t border-gray-800 flex items-center px-4 py-2 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <ChevronUp className="h-4 w-4 mr-2 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">Console</span>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="flex flex-col bg-[#1e1e1e] border-t border-gray-800 relative z-10 flex-shrink-0"
      style={{ height: `${height}px` }}
    >
      {/* Drag handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/50 z-20"
        onMouseDown={() => setIsDragging(true)}
      />

      {/* Overlay to prevent editor from stealing mouse events during drag */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-row-resize" />}

      {/* Tabs Header */}
      <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-gray-800 px-2 pt-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('input')}
            className={twMerge(
              'px-4 py-2 text-sm font-medium flex items-center space-x-2 border-b-2 transition-colors',
              activeTab === 'input'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50',
            )}
          >
            <AlignLeft className="h-4 w-4" />
            <span>Input</span>
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={twMerge(
              'px-4 py-2 text-sm font-medium flex items-center space-x-2 border-b-2 transition-colors',
              activeTab === 'output'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50',
            )}
          >
            <Terminal className="h-4 w-4" />
            <span>Output</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
          </button>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded mr-2"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#0d0d0d]">
        {activeTab === 'input' && (
          <div className="h-full p-4">
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="w-full h-full bg-[#1e1e1e] text-gray-300 text-sm font-mono p-4 border border-gray-700 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Custom Input (stdin)..."
              spellCheck={false}
            />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="p-4 font-mono text-sm space-y-4">
            {isLoading ? (
              <div className="flex items-center space-x-3 text-blue-400 p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Running...</span>
              </div>
            ) : error ? (
              <div className="bg-red-950/30 border border-red-900/50 rounded-md p-4 flex items-start space-x-3 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="overflow-x-auto">
                  <div className="font-semibold mb-1">Execution Error</div>
                  <pre className="whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-xs font-sans">
                  <div className="bg-[#1e1e1e] px-3 py-2 rounded-md border border-gray-800 flex items-center space-x-2">
                    <span className="text-gray-500">Runtime</span>
                    <span className="text-gray-300 font-semibold">{result.runtime} ms</span>
                  </div>
                  <div className="bg-[#1e1e1e] px-3 py-2 rounded-md border border-gray-800 flex items-center space-x-2">
                    <span className="text-gray-500">Memory</span>
                    <span className="text-gray-300 font-semibold">{result.memory} MB</span>
                  </div>
                  <div
                    className={clsx(
                      'px-3 py-2 rounded-md border flex items-center space-x-2',
                      result.success
                        ? 'bg-green-950/30 border-green-900/50'
                        : 'bg-red-950/30 border-red-900/50',
                    )}
                  >
                    <span className={result.success ? 'text-green-500' : 'text-red-500'}>
                      Exit Code
                    </span>
                    <span
                      className={clsx(
                        'font-semibold',
                        result.success ? 'text-green-400' : 'text-red-400',
                      )}
                    >
                      {result.exitCode}
                    </span>
                  </div>
                </div>

                {/* Stdout */}
                {result.stdout && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-sans font-semibold uppercase tracking-wider">
                      Output
                    </div>
                    <div className="bg-[#1e1e1e] border border-gray-800 rounded-md p-4 overflow-x-auto">
                      <pre className="text-gray-300 whitespace-pre-wrap">{result.stdout}</pre>
                    </div>
                  </div>
                )}

                {/* Stderr */}
                {result.stderr && (
                  <div>
                    <div className="text-xs text-red-500 mb-2 font-sans font-semibold uppercase tracking-wider">
                      Error Output
                    </div>
                    <div className="bg-red-950/20 border border-red-900/50 rounded-md p-4 overflow-x-auto">
                      <pre className="text-red-400 whitespace-pre-wrap">{result.stderr}</pre>
                    </div>
                  </div>
                )}

                {!result.stdout && !result.stderr && (
                  <div className="text-gray-500 italic p-4 bg-[#1e1e1e] rounded-md border border-gray-800 text-center">
                    Program finished with no output.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic p-8 text-center bg-[#1e1e1e] rounded-md border border-gray-800">
                Click Run to execute your code.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
