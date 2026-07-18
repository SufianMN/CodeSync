import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/axios';
import { GoogleLogin } from '@react-oauth/google';
import { Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        setError('Google authentication failed.');
        return;
      }

      const res = await apiClient.post('/auth/google', {
        token: credentialResponse.credential,
      });

      login(res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Google login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12 text-white selection:bg-blue-500/30">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center justify-center space-y-4">
          <Link to="/" className="flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold tracking-tight">CodeSync</span>
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-100">Create an account</h2>
          <p className="text-sm text-gray-400">Join CodeSync and start collaborating</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed')}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="signup_with"
            />
          </div>

          <div className="relative mb-6 flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-4 flex-shrink-0 text-xs uppercase tracking-wider text-gray-500">
              or
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Name</label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-white/10 bg-black/20 p-2.5 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={name}
                placeholder="John Doe"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Email address</label>
              <input
                type="email"
                required
                className="w-full rounded-lg border border-white/10 bg-black/20 p-2.5 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-lg border border-white/10 bg-black/20 p-2.5 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full rounded-lg border border-white/10 bg-black/20 p-2.5 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={confirmPassword}
                placeholder="••••••••"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
