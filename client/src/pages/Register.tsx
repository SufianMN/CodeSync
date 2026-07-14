import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/axios';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err: any) {
      if (Array.isArray(err.response?.data?.error)) {
        setError(err.response.data.error.map((e: any) => e.message).join(', '));
      } else {
        setError(err.response?.data?.error || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-8 shadow-lg">
        <h2 className="mb-6 text-3xl font-bold text-center">Create an Account</h2>
        {error && <div className="mb-4 rounded bg-red-500/20 p-3 text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Name</label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <input
              type="password"
              required
              className="mt-1 w-full rounded border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 p-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
