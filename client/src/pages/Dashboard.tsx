import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
        <h1 className="text-xl font-bold">CodeSync</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">{user?.name}</span>
          <button
            onClick={logout}
            className="rounded bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome back, {user?.name}!</h2>
        <p className="text-gray-400">
          This is a protected route. Room features will be added here in the future.
        </p>
      </main>
    </div>
  );
}
