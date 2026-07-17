import { useState } from 'react';
import { ChevronRight, ChevronDown, File, FilePlus, FolderPlus, Trash, Edit2 } from 'lucide-react';
import { WorkspaceNode } from '../../api/workspace.api';
import { twMerge } from 'tailwind-merge';
import { toastPrompt, toastConfirm } from '../../utils/toastPrompt';

interface ExplorerProps {
  nodes: WorkspaceNode[];
  activeFileId: string | null;
  onOpenFile: (node: WorkspaceNode) => void;
  onCreateFile: (parentId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Explorer({
  nodes,
  activeFileId,
  onOpenFile,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  isOpen,
  setIsOpen,
}: ExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const buildTree = (parentId: string | null): WorkspaceNode[] => {
    return nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'FOLDER' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  };

  const renderNode = (node: WorkspaceNode, depth: number) => {
    const isFolder = node.type === 'FOLDER';
    const isExpanded = expandedFolders.has(node.id);
    const isActive = activeFileId === node.id;
    const paddingLeft = `${depth * 12 + 12}px`;

    return (
      <div key={node.id}>
        <div
          className={twMerge(
            'group flex items-center justify-between py-1 cursor-pointer transition-colors text-sm',
            isActive ? 'bg-blue-900/30 text-blue-400' : 'text-gray-300 hover:bg-gray-800',
          )}
          style={{ paddingLeft, paddingRight: '8px' }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.id);
            } else {
              onOpenFile(node);
            }
          }}
        >
          <div className="flex items-center space-x-1.5 overflow-hidden">
            {isFolder ? (
              isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )
            ) : (
              <File className="h-3.5 w-3.5 shrink-0 opacity-70 ml-3.5" />
            )}
            <span className="truncate select-none">{node.name}</span>
          </div>

          <div className="hidden group-hover:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile(node.id);
                  }}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  title="New File"
                >
                  <FilePlus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(node.id);
                  }}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  title="New Folder"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const newName = await toastPrompt('Enter new name:', node.name, 'top-left');
                if (newName && newName !== node.name) {
                  onRename(node.id, newName);
                }
              }}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              title="Rename"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (
                  await toastConfirm(`Are you sure you want to delete ${node.name}?`, 'top-left')
                ) {
                  onDelete(node.id);
                }
              }}
              className="p-1 hover:bg-red-900 rounded text-gray-400 hover:text-red-400"
              title="Delete"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isFolder && isExpanded && (
          <div className="flex flex-col">
            {buildTree(node.id).map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = buildTree(null);

  if (!isOpen) {
    return (
      <div
        className="flex flex-col h-full bg-[#181818] border-r border-gray-900 w-12 items-center py-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <ChevronRight className="h-5 w-5 text-gray-400 mb-4" />
        <span
          className="text-sm font-semibold text-gray-400"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Explorer
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#181818] overflow-hidden">
      <div className="flex items-center justify-between p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsOpen(false)} className="hover:text-white">
            <ChevronDown className="h-4 w-4" />
          </button>
          <span>Explorer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onCreateFile(null)}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
            title="New File"
          >
            <FilePlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => onCreateFolder(null)}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rootNodes.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <p className="mb-4">No files in this workspace.</p>
            <button
              onClick={() => onCreateFile(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create File
            </button>
          </div>
        ) : (
          <div className="pb-4">{rootNodes.map((node) => renderNode(node, 0))}</div>
        )}
      </div>
    </div>
  );
}
