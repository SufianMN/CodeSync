import { ChevronDown, ChevronRight, Terminal } from 'lucide-react';

interface InputPanelProps {
  stdin: string;
  setStdin: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function InputPanel({ stdin, setStdin, isOpen, setIsOpen }: InputPanelProps) {
  return (
    <div className="border-t border-gray-800 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div
        className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-2" />
        )}
        <Terminal className="h-4 w-4 mr-2 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">Custom Input</span>
      </div>

      {isOpen && (
        <div className="p-2 bg-[#1e1e1e]">
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            className="w-full h-32 bg-[#1e1e1e] text-gray-300 text-sm font-mono p-2 border border-gray-700 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
            placeholder="Enter standard input here..."
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
