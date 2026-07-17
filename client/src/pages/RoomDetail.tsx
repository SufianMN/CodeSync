import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoomById, getRoomCode, Room } from '../api/rooms';
import { useAutosave } from '../hooks/useAutosave';
import { useCollaboration } from '../hooks/useCollaboration';
import { usePresence } from '../hooks/usePresence';
import { RoomHeader } from '../components/RoomHeader/RoomHeader';
import { MonacoEditor } from '../components/Editor/MonacoEditor';
import { ParticipantPanel } from '../components/ParticipantPanel/ParticipantPanel';
import { ExecutionPanel } from '../components/Execution/ExecutionPanel';
import { executeCode, ExecuteResponse } from '../api/execute';
import { throttle, debounce } from '../utils/throttle';
import { socket } from '../socket/socket';

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Execution states
  const [stdin, setStdin] = useState('');
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecuteResponse | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  const { saveState, onEdit, saveToBackend } = useAutosave(id || '');

  const isInitialized = useRef(false);
  const isRemoteUpdate = useRef(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsCollectionRef = useRef<any>(null);
  const typingRef = useRef(false);

  const { participants } = usePresence(id || '');

  const handleRun = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setIsExecutionPanelOpen(true);
    setExecError(null);
    setExecResult(null);

    try {
      // Ensure the latest code is saved
      await saveToBackend(code, language);

      const result = await executeCode({
        language,
        code,
        stdin,
      });

      setExecResult(result);
    } catch (err: any) {
      let errorMsg = 'Execution failed';

      if (err.response?.data) {
        const data = err.response.data;
        if (data.details) {
          if (Array.isArray(data.details)) {
            // Zod error array
            errorMsg = data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n');
          } else if (typeof data.details === 'object') {
            // Other object
            errorMsg = JSON.stringify(data.details, null, 2);
          } else {
            // String or primitive
            errorMsg = String(data.details);
          }
        } else if (data.error) {
          errorMsg = data.error;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      setExecError(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTypingStop = useCallback(
    debounce(() => {
      if (socket.connected && id) {
        socket.emit('typing:stop', { roomId: id });
        typingRef.current = false;
      }
    }, 2000),
    [id],
  );

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Handle Ctrl+Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    editor.onDidChangeCursorPosition(
      throttle((e: any) => {
        if (socket.connected && id) {
          socket.emit('cursor:update', {
            roomId: id,
            cursor: { line: e.position.lineNumber, column: e.position.column },
          });
        }
      }, 50),
    );

    editor.onDidChangeCursorSelection(
      throttle((e: any) => {
        if (socket.connected && id) {
          socket.emit('selection:update', {
            roomId: id,
            selection: {
              startLineNumber: e.selection.startLineNumber,
              startColumn: e.selection.startColumn,
              endLineNumber: e.selection.endLineNumber,
              endColumn: e.selection.endColumn,
            },
          });
        }
      }, 50),
    );
  };

  const { status: connectionStatus, broadcastChange } = useCollaboration(
    id || '',
    (newCode) => {
      if (editorRef.current && editorRef.current.getValue() !== newCode) {
        isRemoteUpdate.current = true;
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(newCode);
        editorRef.current.setPosition(position);
      }
      setCode(newCode);
    },
    (newCode, newLanguage) => {
      if (editorRef.current && editorRef.current.getValue() !== newCode) {
        isRemoteUpdate.current = true;
        editorRef.current.setValue(newCode);
      }
      setCode(newCode);
      setLanguage(newLanguage);
    },
  );

  // Handle remote cursors and selections
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const decorations: any[] = [];
    const styleId = 'monaco-presence-styles';
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    let css = '';

    participants.forEach((p) => {
      if (p.socketId === socket.id) return;

      css += `
        .selection-${p.socketId} {
          background-color: ${p.color}40;
        }
        .cursor-${p.socketId} {
          border-left: 2px solid ${p.color};
          position: relative;
          z-index: 9;
        }
      `;

      if (
        p.selection &&
        (p.selection.startLineNumber !== p.selection.endLineNumber ||
          p.selection.startColumn !== p.selection.endColumn)
      ) {
        decorations.push({
          range: new monaco.Range(
            p.selection.startLineNumber,
            p.selection.startColumn,
            p.selection.endLineNumber,
            p.selection.endColumn,
          ),
          options: {
            className: `selection-${p.socketId}`,
            hoverMessage: { value: p.username },
          },
        });
      }

      if (p.cursor) {
        decorations.push({
          range: new monaco.Range(p.cursor.line, p.cursor.column, p.cursor.line, p.cursor.column),
          options: {
            className: `cursor-${p.socketId}`,
            hoverMessage: { value: p.username },
          },
        });
      }
    });

    styleEl.innerHTML = css;

    if (!decorationsCollectionRef.current) {
      decorationsCollectionRef.current = editor.createDecorationsCollection(decorations);
    } else {
      decorationsCollectionRef.current.set(decorations);
    }

    return () => {};
  }, [participants]);

  useEffect(() => {
    return () => {
      const styleEl = document.getElementById('monaco-presence-styles');
      if (styleEl) styleEl.remove();
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchInitialData = async () => {
      try {
        const [roomData, codeData] = await Promise.all([getRoomById(id), getRoomCode(id)]);
        setRoom(roomData);
        setCode(codeData.code);
        setLanguage(codeData.language);
        setTimeout(() => {
          isInitialized.current = true;
        }, 500);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setCode(newCode);

    if (socket.connected && id) {
      if (!typingRef.current) {
        typingRef.current = true;
        socket.emit('typing:start', { roomId: id });
      }
      handleTypingStop();
    }

    if (isInitialized.current) {
      onEdit(newCode, language);
      broadcastChange(newCode);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (isInitialized.current) {
      saveToBackend(code, newLanguage);
    }
  };

  if (loading) {
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
        onLanguageChange={handleLanguageChange}
        saveState={saveState}
        connectionStatus={connectionStatus}
        onRun={handleRun}
        isRunning={isExecuting}
      />
      <div className="flex flex-1 overflow-hidden">
        <ParticipantPanel participants={participants} />

        <main className="flex-1 flex flex-col relative min-w-0">
          <div className="flex-1 relative hidden md:block">
            <MonacoEditor
              language={language}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
            />
          </div>

          <div className="flex h-full items-center justify-center p-8 text-center md:hidden bg-gray-950 text-white">
            <p className="text-gray-400">Editing is best experienced on desktop.</p>
          </div>

          <div className="flex flex-col flex-shrink-0 z-10 hidden md:flex">
            <ExecutionPanel
              stdin={stdin}
              setStdin={setStdin}
              result={execResult}
              isLoading={isExecuting}
              error={execError}
              isOpen={isExecutionPanelOpen}
              setIsOpen={setIsExecutionPanelOpen}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
