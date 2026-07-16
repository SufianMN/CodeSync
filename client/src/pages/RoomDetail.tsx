import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoomById, getRoomCode, Room } from '../api/rooms';
import { useAutosave } from '../hooks/useAutosave';
import { useCollaboration } from '../hooks/useCollaboration';
import { RoomHeader } from '../components/RoomHeader/RoomHeader';
import { MonacoEditor } from '../components/Editor/MonacoEditor';

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { saveState, onEdit, saveToBackend } = useAutosave(id || '');

  // Track initialization to avoid saving on first render
  const isInitialized = useRef(false);
  const isRemoteUpdate = useRef(false);
  const editorRef = useRef<any>(null);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
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

  useEffect(() => {
    if (!id) return;
    const fetchInitialData = async () => {
      try {
        const [roomData, codeData] = await Promise.all([getRoomById(id), getRoomCode(id)]);
        setRoom(roomData);
        setCode(codeData.code);
        setLanguage(codeData.language);
        // Using a short timeout to prevent Monaco's initial layout events from triggering an immediate onEdit save
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
    if (isInitialized.current) {
      onEdit(newCode, language);
      broadcastChange(newCode);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (isInitialized.current) {
      // Save immediately on language change
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
      />
      <main className="flex-1 relative">
        <div className="absolute inset-0 hidden md:block">
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
      </main>
    </div>
  );
}
