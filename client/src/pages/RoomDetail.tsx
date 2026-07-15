import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoomById, Room } from '../api/rooms';
import { Code2, ArrowLeft } from 'lucide-react';

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchRoom = async () => {
      try {
        const data = await getRoomById(id);
        setRoom(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

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
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="rounded p-1 hover:bg-gray-800 transition">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div className="flex items-center space-x-2">
            <Code2 className="h-5 w-5 text-blue-500" />
            <h1 className="font-semibold">{room.name}</h1>
            <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium uppercase text-gray-400">
              {room.language}
            </span>
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-gray-950 p-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-200">Coming Soon...</h2>
          <p className="text-gray-400">(Monaco Editor will be added in Milestone 5)</p>
        </div>
      </main>
    </div>
  );
}
