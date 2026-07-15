import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRooms, deleteRoom, updateRoom, Room } from '../api/rooms';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { Trash2, Edit2, Code2, Plus } from 'lucide-react';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await deleteRoom(id);
      // Fetch rooms again to ensure UI matches DB exactly
      await fetchRooms();
    } catch (error: any) {
      console.error('Failed to delete room', error);
      alert(error.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleRenameSubmit = async (id: string) => {
    if (!editName.trim()) {
      setEditingRoomId(null);
      return;
    }

    const room = rooms.find((r) => r.id === id);
    if (room && room.name === editName.trim()) {
      setEditingRoomId(null);
      return;
    }

    try {
      await updateRoom(id, editName.trim());
      await fetchRooms();
    } catch (error: any) {
      console.error('Failed to rename room', error);
      alert(error.response?.data?.error || 'Failed to rename room');
    } finally {
      setEditingRoomId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setEditingRoomId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center space-x-2">
          <Code2 className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-bold">CodeSync</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">{user?.name}</span>
          <button
            onClick={logout}
            className="rounded bg-gray-800 px-3 py-1 text-sm font-medium hover:bg-gray-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Rooms</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Room</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-800 bg-gray-900 py-16">
            <div className="mb-4 rounded-full bg-gray-800 p-4">
              <Code2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-2 text-lg font-medium text-gray-300">No rooms yet.</p>
            <p className="text-sm text-gray-500">Create your first collaborative room.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="group flex flex-col justify-between rounded-lg border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-700 hover:shadow-lg"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between min-h-[32px]">
                    {editingRoomId === room.id ? (
                      <div className="flex w-full items-center space-x-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, room.id)}
                          className="w-full flex-1 rounded border border-blue-500 bg-gray-800 px-2 py-1 text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleRenameSubmit(room.id)}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingRoomId(null)}
                          className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h3 className="truncate text-lg font-medium" title={room.name}>
                        {room.name}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-medium text-gray-400">
                    <span className="rounded bg-gray-800 px-2 py-1 uppercase">{room.language}</span>
                    <span>•</span>
                    <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
                  <button
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                  >
                    Open Room
                  </button>
                  <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditName(room.name);
                        setEditingRoomId(room.id);
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
                      title="Rename"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(room.id, e)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchRooms}
      />
    </div>
  );
}
