import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRooms, deleteRoom, updateRoom, Room } from '../api/rooms';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { JoinRoomModal } from '../components/JoinRoomModal';
import { Trash2, Edit2, Code2, Plus, LogIn, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { toastConfirm } from '../utils/toastPrompt';
import { formatDistanceToNow } from '../utils/date';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
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
    if (!(await toastConfirm('Are you sure you want to delete this room?'))) return;
    try {
      await deleteRoom(id);
      await fetchRooms();
    } catch (error: any) {
      console.error('Failed to delete room', error);
      toast.error(error.response?.data?.error || 'Failed to delete room');
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
      toast.error(error.response?.data?.error || 'Failed to rename room');
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
    <div className="flex min-h-screen flex-col bg-gray-950 text-white selection:bg-blue-500/30">
      <header className="flex items-center justify-between border-b border-white/10 bg-gray-900/50 p-4 backdrop-blur-md">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Code2 className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-bold tracking-tight">CodeSync</h1>
        </Link>
        <div className="flex items-center space-x-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-lg">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6 sm:p-8 space-y-12">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0]}
          </h2>
          <p className="mt-2 text-gray-400">
            Continue where you left off or start a new collaborative session.
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-4">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-gray-900/50 p-6 text-left hover:bg-gray-800/80 transition-colors group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-medium text-white">Create Room</h4>
                <p className="text-sm text-gray-400">Start a new workspace</p>
              </div>
            </button>

            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-gray-900/50 p-6 text-left hover:bg-gray-800/80 transition-colors group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <LogIn className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-medium text-white">Join Room</h4>
                <p className="text-sm text-gray-400">Enter with a room ID</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Rooms */}
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-4">Recent Rooms</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-gray-900/20 py-16">
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
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="group flex flex-col justify-between rounded-xl border border-white/10 bg-gray-900 p-5 transition-all hover:border-white/20 hover:shadow-lg hover:shadow-blue-900/10 cursor-pointer"
                >
                  <div>
                    <div className="mb-3 flex items-start justify-between min-h-[32px]">
                      {editingRoomId === room.id ? (
                        <div
                          className="flex w-full items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                        </div>
                      ) : (
                        <h3
                          className="truncate text-lg font-semibold tracking-tight text-white"
                          title={room.name}
                        >
                          {room.name}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-medium text-gray-400">
                      <span className="rounded bg-gray-800 px-2 py-1 uppercase text-gray-300">
                        {room.language}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{room.membersCount || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {room.updatedAt
                          ? formatDistanceToNow(new Date(room.updatedAt))
                          : new Date(room.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      {room.ownerId === user?.id && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditName(room.name);
                              setEditingRoomId(room.id);
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
                            title="Rename"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(room.id, e)}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchRooms}
      />

      <JoinRoomModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </div>
  );
}
