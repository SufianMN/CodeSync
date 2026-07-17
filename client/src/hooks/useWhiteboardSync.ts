import { useEffect, useState, useRef } from 'react';
import { createTLStore, defaultShapeUtils, TLStore, getSnapshot, loadSnapshot } from 'tldraw';
import { socket } from '../socket/socket';
import { debounce } from '../utils/throttle';
import { SaveState } from './useAutosave';

export function useWhiteboardSync(roomId: string) {
  const [store] = useState<TLStore>(() => createTLStore({ shapeUtils: defaultShapeUtils }));
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('Saved');

  // Debounced save function to persist snapshot
  const saveSnapshot = useRef(
    debounce((data: string) => {
      setSaveState('Saving...');
      socket.emit('whiteboard:save', { roomId, data }, (success: boolean) => {
        if (success) {
          setSaveState('Saved');
        } else {
          setSaveState('Failed to save');
        }
      });
    }, 5000), // autosave every 5 seconds of inactivity
  ).current;

  useEffect(() => {
    // 1. Join Whiteboard Room and request initial snapshot
    socket.emit('whiteboard:join', roomId);

    // 2. Handle initial snapshot load
    const handleInit = (snapshotData: string) => {
      try {
        const parsed = JSON.parse(snapshotData);
        loadSnapshot(store, parsed);
      } catch (err) {
        console.error('Failed to load whiteboard snapshot', err);
      }
      setIsLoaded(true);
    };

    // 3. Handle remote updates
    const handleUpdate = ({ changes }: { changes: any }) => {
      try {
        store.mergeRemoteChanges(() => {
          store.put([...changes.added, ...changes.updated]);
          store.remove(changes.removed);
        });
      } catch (err) {
        console.error('Failed to merge remote whiteboard changes', err);
      }
    };

    socket.on('whiteboard:init', handleInit);
    socket.on('whiteboard:update', handleUpdate);

    // If we don't get an init event after 1.5s, assume it's a new board
    const timeout = setTimeout(() => {
      if (!isLoaded) setIsLoaded(true);
    }, 1500);

    return () => {
      socket.off('whiteboard:init', handleInit);
      socket.off('whiteboard:update', handleUpdate);
      clearTimeout(timeout);
    };
  }, [roomId, store, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    // 4. Listen to local changes and broadcast them
    const unlisten = store.listen((event) => {
      if (event.source !== 'user') return; // Only broadcast user-initiated actions

      const addedIds = Object.keys(event.changes.added);
      const updatedIds = Object.keys(event.changes.updated);
      const removedIds = Object.keys(event.changes.removed);

      const isDocRecord = (id: string) =>
        id.startsWith('shape:') ||
        id.startsWith('binding:') ||
        id.startsWith('asset:') ||
        id.startsWith('page:') ||
        id.startsWith('document:');

      const isDocumentChange =
        addedIds.some(isDocRecord) || updatedIds.some(isDocRecord) || removedIds.some(isDocRecord);

      if (isDocumentChange) {
        setSaveState('Unsaved Changes');
      }

      const changes = {
        added: Object.values(event.changes.added),
        updated: Object.values(event.changes.updated).map((u) => u[1]),
        removed: removedIds,
      };

      // Broadcast incremental update to peers
      socket.emit('whiteboard:update', { roomId, changes });

      // Trigger debounced save for backend persistence only for document changes
      if (isDocumentChange) {
        const snapshot = getSnapshot(store);
        saveSnapshot(JSON.stringify(snapshot));
      }
    });

    return () => {
      unlisten();
    };
  }, [store, roomId, isLoaded, saveSnapshot]);

  return { store, isLoaded, saveState };
}
