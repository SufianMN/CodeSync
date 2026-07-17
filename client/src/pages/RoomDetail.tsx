import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoomById } from '../api/rooms';
import { useAutosave } from '../hooks/useAutosave';
import { usePresence } from '../hooks/usePresence';
import { useWorkspaceTree } from '../hooks/useWorkspaceTree';
import { useFileCollaboration } from '../hooks/useFileCollaboration';
import { RoomHeader } from '../components/RoomHeader/RoomHeader';
import { MonacoEditor } from '../components/Editor/MonacoEditor';
import { ParticipantPanel } from '../components/ParticipantPanel/ParticipantPanel';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { ExecutionPanel } from '../components/Execution/ExecutionPanel';
import { Explorer } from '../components/Workspace/Explorer';
import { EditorTabs } from '../components/Workspace/EditorTabs';
import { executeCode, ExecuteResponse } from '../api/execute';
import { throttle, debounce } from '../utils/throttle';
import { socket } from '../socket/socket';
import { useWorkspace } from '../hooks/useWorkspace';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { useShortcuts } from '../hooks/useShortcuts';
import { twMerge } from 'tailwind-merge';
import { toastPrompt } from '../utils/toastPrompt';
export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const roomId = id || '';
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Workspace Tree
  const {
    nodes,
    loading: treeLoading,
    activeFileId,
    setActiveFileId,
    openTabs,
    openFile,
    closeTab,
    activeNode,
    createNode,
    updateNode,
    deleteNode,
  } = useWorkspaceTree(roomId);

  // Editor states
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('txt');

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const viewStates = useRef(new Map<string, any>());
  const isRemoteUpdate = useRef(false);

  // Collaboration
  const {
    participants, // All users
  } = usePresence(roomId);

  const { broadcastCodeChange, broadcastCursor, broadcastSelection, setTypingStatus } =
    useFileCollaboration(roomId, activeFileId);

  const { saveState, onEdit, saveToBackend } = useAutosave();

  // Execution states
  const [stdin, setStdin] = useState('');
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecuteResponse | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  const { explorer, sidebar, terminal, chat, isDraggingAny, resetLayout } = useWorkspace();
  const { settings, updateSetting, resetSettings } = useEditorSettings();

  const [isExplorerOpen, setIsExplorerOpen] = useState(true);

  useEffect(() => {
    async function loadRoom() {
      try {
        setLoading(true);
        const data = await getRoomById(roomId);
        setRoom(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [roomId]);

  // Handle active file switching
  useEffect(() => {
    if (activeNode) {
      if (editorRef.current && code) {
        // We shouldn't save state here easily unless we know the previous ID.
        // We rely on closeTab or manual clicks to save state.
      }
      setCode(activeNode.content || '');
      setLanguage(activeNode.language || 'txt');

      // Restore view state if it exists
      if (editorRef.current && viewStates.current.has(activeNode.id)) {
        editorRef.current.restoreViewState(viewStates.current.get(activeNode.id));
      }
    } else {
      setCode('');
      setLanguage('txt');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId]); // Deliberately omitted activeNode to avoid code overwrite issues, wait activeFileId triggers it.

  // Socket IO file events listener
  useEffect(() => {
    if (!socket.connected || !roomId) return;

    const handleFileUpdate = ({ fileId, code: newCode }: { fileId: string; code: string }) => {
      // If we are looking at the file, update UI
      if (fileId === activeFileId) {
        if (editorRef.current && editorRef.current.getValue() !== newCode) {
          isRemoteUpdate.current = true;
          const position = editorRef.current.getPosition();
          editorRef.current.setValue(newCode);
          editorRef.current.setPosition(position);
        }
        setCode(newCode);
      } else {
        // The tree handles content fetching, but actually the node content might be outdated.
        // For a full system we'd update `nodes` or just refetch. But for now we only care about active file.
      }
    };

    const handleRemoteCursor = (_payload: any) => {
      // Add cursor logic using decorations
      // We can implement this in the activeParticipants render effect
    };

    socket.on('file:update', handleFileUpdate);
    socket.on('file:cursor', handleRemoteCursor);

    return () => {
      socket.off('file:update', handleFileUpdate);
      socket.off('file:cursor', handleRemoteCursor);
    };
  }, [roomId, activeFileId]);

  // Handle Ctrl+S and layout shortcuts
  const handleResetLayout = () => {
    resetLayout();
    resetSettings();
  };

  useShortcuts({
    onRunCode: () => handleRun(),
    onSave: () => activeFileId && saveToBackend(activeFileId, code, language),
    onToggleSidebar: () => sidebar.resetSize(sidebar.size < 100 ? 320 : 0),
    onToggleTerminal: () => setIsExecutionPanelOpen(!isExecutionPanelOpen),
    onCopyLink: () => navigator.clipboard.writeText(window.location.href),
    onIncreaseFontSize: () => updateSetting('fontSize', Math.min(24, settings.fontSize + 1)),
    onDecreaseFontSize: () => updateSetting('fontSize', Math.max(10, settings.fontSize - 1)),
    onResetFontSize: () => updateSetting('fontSize', 14),
  });

  const handleRun = async () => {
    if (isExecuting || !activeFileId) return;
    setIsExecuting(true);
    setIsExecutionPanelOpen(true);
    setExecError(null);
    setExecResult(null);

    try {
      const supportedLanguages = ['cpp', 'python', 'java', 'javascript'];
      if (!supportedLanguages.includes(language.toLowerCase())) {
        setExecError(
          `Execution for '${language}' is not supported yet.\nSupported languages are: ${supportedLanguages.join(', ')}`,
        );
        setIsExecuting(false);
        return;
      }

      await saveToBackend(activeFileId, code, language);
      const result = await executeCode({ language: language.toLowerCase(), code, stdin });
      setExecResult(result);
    } catch (err: any) {
      let errorMsg = 'Execution failed';
      if (err.response?.data?.details) {
        try {
          const details =
            typeof err.response.data.details === 'string'
              ? JSON.parse(err.response.data.details)
              : err.response.data.details;
          if (Array.isArray(details) && details[0]?.message) {
            errorMsg = details.map((d: any) => d.message).join('\n');
          } else {
            errorMsg = JSON.stringify(details, null, 2);
          }
        } catch {
          errorMsg = JSON.stringify(err.response.data.details, null, 2);
        }
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setExecError(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRun());

    editor.onDidChangeCursorPosition(
      throttle((e: any) => {
        broadcastCursor({ line: e.position.lineNumber, column: e.position.column });
      }, 50),
    );

    editor.onDidChangeCursorSelection(
      throttle((e: any) => {
        broadcastSelection({
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn,
        });
      }, 50),
    );
  };

  const handleEditorChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setCode(newCode);
    if (activeFileId) {
      onEdit(activeFileId, newCode, language);
      broadcastCodeChange(newCode);
      setTypingStatus(true);
      handleTypingStop();
    }
  };

  const handleTypingStop = useCallback(
    debounce(() => {
      setTypingStatus(false);
    }, 2000),
    [setTypingStatus],
  );

  const handleTabClick = (fileId: string) => {
    if (editorRef.current && activeFileId) {
      viewStates.current.set(activeFileId, editorRef.current.saveViewState());
    }
    setActiveFileId(fileId);
  };

  if (loading || treeLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-950 text-white">
        <div className="mb-4 text-red-400">{error || 'Room not found'}</div>
        <Link to="/dashboard" className="text-blue-500 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e] overflow-hidden">
      <RoomHeader
        roomName={room.name}
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          if (activeFileId) updateNode(activeFileId, { language: lang });
        }}
        saveState={saveState}
        connectionStatus={socket.connected ? 'Connected' : 'Disconnected'}
        onRun={handleRun}
        isRunning={isExecuting}
        editorSettings={settings}
        updateSetting={updateSetting}
        resetLayout={handleResetLayout}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Explorer */}
        <div
          style={{ width: isExplorerOpen ? `${explorer.size}px` : undefined }}
          className="flex-shrink-0 bg-[#181818] hidden md:block z-10"
        >
          <Explorer
            nodes={nodes}
            activeFileId={activeFileId}
            onOpenFile={(node) => {
              if (editorRef.current && activeFileId) {
                viewStates.current.set(activeFileId, editorRef.current.saveViewState());
              }
              openFile(node);
            }}
            onCreateFile={async (parentId) => {
              const name = await toastPrompt('File name:', '', 'top-left');
              if (name) {
                const parts = name.split('.');
                const ext = parts.length > 1 ? parts.pop() : 'txt';
                let lang = 'txt';
                if (ext === 'js') lang = 'javascript';
                if (ext === 'ts') lang = 'typescript';
                if (ext === 'py') lang = 'python';
                if (ext === 'cpp') lang = 'cpp';
                if (ext === 'java') lang = 'java';
                if (ext === 'go') lang = 'go';
                if (ext === 'rs') lang = 'rust';
                await createNode(parentId, 'FILE', name, lang);
              }
            }}
            onCreateFolder={async (parentId) => {
              const name = await toastPrompt('Folder name:', '', 'top-left');
              if (name) await createNode(parentId, 'FOLDER', name);
            }}
            onRename={async (nodeId, newName) => {
              await updateNode(nodeId, { name: newName });
            }}
            onDelete={async (nodeId) => {
              await deleteNode(nodeId);
            }}
            isOpen={isExplorerOpen}
            setIsOpen={setIsExplorerOpen}
          />
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

        <main className="flex-1 flex flex-col relative min-w-0">
          <EditorTabs
            tabs={openTabs}
            activeFileId={activeFileId}
            onTabClick={handleTabClick}
            onTabClose={(id) => closeTab(id)}
          />

          <div className="flex-1 relative hidden md:block min-h-0">
            {activeFileId ? (
              <MonacoEditor
                language={language}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme={settings.theme}
                customOptions={{
                  minimap: { enabled: settings.minimap },
                  wordWrap: settings.wordWrap ? 'on' : 'off',
                  lineNumbers: settings.lineNumbers ? 'on' : 'off',
                  renderLineHighlight: settings.highlightActiveLine ? 'all' : 'none',
                  fontSize: settings.fontSize,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 bg-[#1e1e1e]">
                <div className="text-center">
                  <p className="mb-2">No file is open.</p>
                  <p className="text-sm">Select a file from the explorer or create a new one.</p>
                </div>
              </div>
            )}

            {/* Global overlay while dragging to protect iframe/editor */}
            {isDraggingAny && <div className="absolute inset-0 z-40 bg-transparent" />}
          </div>

          <div className="flex flex-col flex-shrink-0 z-10 hidden md:flex min-h-0">
            {/* Horizontal divider for Terminal */}
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
            <ExecutionPanel
              stdin={stdin}
              setStdin={setStdin}
              result={execResult}
              isLoading={isExecuting}
              error={execError}
              isOpen={isExecutionPanelOpen}
              setIsOpen={setIsExecutionPanelOpen}
              height={terminal.size}
            />
          </div>
        </main>

        {/* Vertical divider for Sidebar */}
        <div
          className={twMerge(
            'w-1 cursor-col-resize z-50 transition-colors duration-150 flex-shrink-0 hidden lg:block',
            sidebar.isDragging ? 'bg-blue-500' : 'hover:bg-blue-400/50 bg-gray-800',
          )}
          onPointerDown={sidebar.handlePointerDown}
        />

        {/* Right Sidebar */}
        <div
          className="flex flex-col flex-shrink-0 bg-gray-900 hidden lg:flex overflow-hidden relative"
          style={{ width: `${sidebar.size}px` }}
        >
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            <ParticipantPanel participants={participants} nodes={nodes} />
          </div>

          {/* Horizontal divider for Chat */}
          <div
            className={twMerge(
              'h-1 cursor-row-resize z-50 transition-colors duration-150 flex-shrink-0',
              chat.isDragging ? 'bg-blue-500' : 'hover:bg-blue-400/50 bg-gray-800',
            )}
            onPointerDown={chat.handlePointerDown}
          />

          <div
            style={{ height: `${chat.size}px` }}
            className="flex flex-col flex-shrink-0 overflow-hidden relative"
          >
            <ChatPanel roomId={id || ''} participants={participants} />
            {chat.isDragging && <div className="absolute inset-0 z-40 bg-transparent" />}
          </div>
        </div>
      </div>
    </div>
  );
}
