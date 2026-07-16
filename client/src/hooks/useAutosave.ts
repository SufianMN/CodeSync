import { useState, useEffect, useRef, useCallback } from 'react';
import { updateRoomCode } from '../api/rooms';
import toast from 'react-hot-toast';

export type SaveState = 'Saved' | 'Saving...' | 'Unsaved Changes' | 'Failed to save';

export function useAutosave(roomId: string) {
  const [saveState, setSaveState] = useState<SaveState>('Saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef<{ code: string; language: string } | null>(null);

  const saveToBackend = useCallback(
    async (code: string, language: string) => {
      setSaveState('Saving...');
      try {
        await updateRoomCode(roomId, code, language);
        setSaveState('Saved');
      } catch (error) {
        console.error('Autosave failed', error);
        setSaveState('Failed to save');
        toast.error('Failed to save changes');
      }
    },
    [roomId],
  );

  const onEdit = useCallback(
    (code: string, language: string) => {
      latestData.current = { code, language };
      setSaveState('Unsaved Changes');

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (latestData.current) {
          saveToBackend(latestData.current.code, latestData.current.language);
        }
      }, 2000);
    },
    [saveToBackend],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { saveState, setSaveState, onEdit, saveToBackend };
}
