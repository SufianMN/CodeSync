import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { useWorkspace } from '../../hooks/useWorkspace';

interface WorkspaceLayoutProps {
  explorerContent: ReactNode;
  middlePanelContent: ReactNode;
  bottomPanelContent?: ReactNode;
  rightSidebarContent?: ReactNode;
  isExplorerOpen: boolean;
  isExecutionPanelOpen?: boolean;
}

export function WorkspaceLayout({
  explorerContent,
  middlePanelContent,
  bottomPanelContent,
  rightSidebarContent,
  isExplorerOpen,
  isExecutionPanelOpen,
}: WorkspaceLayoutProps) {
  const { explorer, sidebar, terminal, isDraggingAny } = useWorkspace();

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Left Sidebar: Explorer */}
      <div
        style={{ width: isExplorerOpen ? `${explorer.size}px` : undefined }}
        className="flex-shrink-0 bg-[#181818] hidden md:block z-10"
      >
        {explorerContent}
      </div>

      {/* Explorer Divider */}
      {isExplorerOpen && (
        <div
          className={twMerge(
            'w-1 cursor-col-resize z-50 transition-colors duration-150 flex-shrink-0 hidden md:block',
            explorer.isDragging
              ? 'bg-blue-500'
              : 'hover:bg-blue-400/50 bg-gray-800 border-x border-gray-900',
          )}
          onPointerDown={explorer.handlePointerDown}
        />
      )}

      {/* Middle Column (Editor + Bottom Panel) */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#1e1e1e]">
        <div className="flex-1 relative flex flex-col min-h-0">
          {middlePanelContent}
          {/* Global overlay while dragging to protect iframe/editor */}
          {isDraggingAny && <div className="absolute inset-0 z-40 bg-transparent" />}
        </div>

        {/* Bottom Panel */}
        {bottomPanelContent && (
          <div className="flex flex-col flex-shrink-0 z-10 hidden md:flex min-h-0">
            {isExecutionPanelOpen && (
              <div
                className={twMerge(
                  'h-1 cursor-row-resize z-50 transition-colors duration-150 flex-shrink-0 relative',
                  terminal.isDragging
                    ? 'bg-blue-500'
                    : 'hover:bg-blue-400/50 bg-gray-800 border-t border-gray-800',
                )}
                onPointerDown={terminal.handlePointerDown}
              />
            )}
            {bottomPanelContent}
          </div>
        )}
      </main>

      {/* Vertical divider for Right Sidebar */}
      {rightSidebarContent && (
        <>
          <div
            className={twMerge(
              'w-1 cursor-col-resize z-50 transition-colors duration-150 flex-shrink-0 hidden lg:block',
              sidebar.isDragging
                ? 'bg-blue-500'
                : 'hover:bg-blue-400/50 bg-gray-800 border-l border-gray-900',
            )}
            onPointerDown={sidebar.handlePointerDown}
          />
          <div
            className="flex flex-col flex-shrink-0 bg-gray-900 hidden lg:flex overflow-hidden relative"
            style={{ width: `${sidebar.size}px` }}
          >
            {rightSidebarContent}
          </div>
        </>
      )}
    </div>
  );
}
