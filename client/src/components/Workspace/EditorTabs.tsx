import { X, File } from 'lucide-react';
import { Tab } from '../../hooks/useWorkspaceTree';
import { twMerge } from 'tailwind-merge';

interface EditorTabsProps {
  tabs: Tab[];
  activeFileId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

export function EditorTabs({ tabs, activeFileId, onTabClick, onTabClose }: EditorTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center overflow-x-auto bg-[#1e1e1e] scrollbar-hide border-b border-gray-800 flex-shrink-0 min-h-[35px]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeFileId;
        return (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={twMerge(
              'group flex items-center space-x-2 px-3 py-1.5 min-w-[120px] max-w-[200px] border-r border-gray-800 cursor-pointer text-sm transition-colors select-none',
              isActive
                ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500'
                : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#252525] border-t-2 border-t-transparent',
            )}
          >
            <File
              className={twMerge(
                'h-3.5 w-3.5 flex-shrink-0',
                isActive ? 'text-blue-400' : 'text-gray-500',
              )}
            />
            <span className="truncate flex-1">{tab.name}</span>
            {tab.isDirty && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={twMerge(
                'p-0.5 rounded transition-opacity',
                isActive
                  ? 'opacity-100 hover:bg-gray-700'
                  : 'opacity-0 group-hover:opacity-100 hover:bg-gray-600',
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
