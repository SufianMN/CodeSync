import { useEffect, useState, useCallback, useRef } from 'react';
import { socket } from '../socket/socket';
import toast from 'react-hot-toast';

export type ConnectionStatus = 'Connected' | 'Connecting...' | 'Disconnected';

export function useCollaboration(
  roomId: string,
  onRemoteCodeUpdate: (code: string) => void,
  onRoomStateReceived: (code: string, language: string) => void,
) {
  const [status, setStatus] = useState<ConnectionStatus>('Disconnected');
  const prevStatusRef = useRef<ConnectionStatus>('Disconnected');
  const callbacksRef = useRef({ onRemoteCodeUpdate, onRoomStateReceived });

  useEffect(() => {
    callbacksRef.current = { onRemoteCodeUpdate, onRoomStateReceived };
  }, [onRemoteCodeUpdate, onRoomStateReceived]);

  useEffect(() => {
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!roomId) return;

    // Connect socket if not already connected
    if (!socket.connected) {
      setStatus('Connecting...');
      socket.connect();
    }

    const onConnect = () => {
      console.log('socket.on("connect")');
      if (prevStatusRef.current === 'Disconnected' && socket.connected) {
        toast.success('Reconnected');
      }
      setStatus('Connected');
      // Join the room upon connection/reconnection
      socket.emit('join-room', { roomId });
    };

    const onDisconnect = () => {
      console.log('socket.on("disconnect")');
      setStatus('Disconnected');
      toast.error('Network disconnected');
    };

    const onConnectError = (err: any) => {
      console.log('socket.on("connect_error")', err.message);
      console.error('Socket connection error:', err.message);
      setStatus('Disconnected');
      toast.error(`Connection error: ${err.message}`);
    };

    const handleRoomState = (payload: { code: string; language: string }) => {
      callbacksRef.current.onRoomStateReceived(payload.code, payload.language);
    };

    const handleCodeUpdate = (payload: { code: string }) => {
      console.log('Client received code:update', payload.code.substring(0, 50));
      callbacksRef.current.onRemoteCodeUpdate(payload.code);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room-state', handleRoomState);
    socket.on('code-update', handleCodeUpdate);

    // If already connected when hook mounts
    if (socket.connected) {
      onConnect();
    }

    return () => {
      console.log('Cleaning up socket listeners for room', roomId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room-state', handleRoomState);
      socket.off('code-update', handleCodeUpdate);

      socket.emit('leave-room', { roomId });
    };
  }, [roomId]); // ONLY DEPEND ON roomId

  const broadcastChange = useCallback(
    (code: string) => {
      if (socket.connected) {
        console.log('Client emitted code:update', code.substring(0, 50));
        socket.emit('code-change', { roomId, code });
      }
    },
    [roomId],
  );

  return { status, broadcastChange };
}
