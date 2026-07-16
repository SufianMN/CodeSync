import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Extract ID if a URL is pasted
    const extractedId = input.trim().split('/').pop();

    if (!extractedId) {
      toast.error('Invalid room ID or URL');
      return;
    }

    onClose();
    navigate(`/room/${extractedId}`);
    toast.success('Joining room...');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-900 border border-gray-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h2 className="text-lg font-semibold text-white">Join Room</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="roomInput" className="mb-2 block text-sm font-medium text-gray-300">
              Room URL or ID
            </label>
            <input
              id="roomInput"
              type="text"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. http://localhost:5173/room/xxxx or xxxx"
              className="w-full rounded border border-gray-700 bg-gray-800 p-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
