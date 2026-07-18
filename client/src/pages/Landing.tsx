import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Code2,
  Terminal,
  Users,
  PenTool,
  FolderTree,
  MessageSquare,
  PlayCircle,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { apiClient } from '../api/axios';
import toast from 'react-hot-toast';

const features = [
  {
    icon: <Users className="h-6 w-6 text-blue-400" />,
    title: 'Real-Time Collaboration',
    description: 'Live editing, presence, and remote cursors for seamless teamwork.',
  },
  {
    icon: <Terminal className="h-6 w-6 text-emerald-400" />,
    title: 'Secure Code Execution',
    description: 'Docker-powered sandbox, stdin, runtime outputs, and compile errors.',
  },
  {
    icon: <PenTool className="h-6 w-6 text-purple-400" />,
    title: 'Whiteboard',
    description: 'Draw algorithms, dry-run solutions, and explain concepts visually.',
  },
  {
    icon: <FolderTree className="h-6 w-6 text-yellow-400" />,
    title: 'Workspace',
    description: 'Multiple files, organized folder structure, and complete project view.',
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-pink-400" />,
    title: 'Room Chat',
    description: 'Live messaging, mentions, and typing indicators within the room.',
  },
  {
    icon: <PlayCircle className="h-6 w-6 text-cyan-400" />,
    title: 'Execution Console',
    description: 'Run with Ctrl+Enter, custom input support, and instant output console.',
  },
];

export function Landing() {
  const { user, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await apiClient.post('/auth/google', { token: tokenResponse.access_token });
        login(res.data.user);
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Google login failed');
      }
    },
    onError: () => {
      toast.error('Google login failed');
    },
  });

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-emerald-600/5 blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            to="/"
            className="flex items-center space-x-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Code2 className="h-7 w-7 text-blue-500" />
            <span className="text-xl font-bold tracking-tight">CodeSync</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Demo
            </a>
            <a href="#compare" className="hover:text-white transition-colors">
              Compare
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center space-x-1"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
            >
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 right-0 border-b border-white/5 bg-gray-900/95 p-6 backdrop-blur-md flex flex-col space-y-4"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              Features
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              Demo
            </a>
            <a
              href="#compare"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              Compare
            </a>
            <Link to="/login" className="text-gray-300 hover:text-white">
              Login
            </Link>
            <Link to="/register" className="text-blue-400 font-medium">
              Register
            </Link>
          </motion.div>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-24">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 pt-12 lg:pt-24 pb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 space-y-8"
          >
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
              Collaborative coding built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                teams.
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              CodeSync is a modern, real-time pair programming environment. Execute code securely,
              draw on a shared whiteboard, and communicate instantly without leaving your browser.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => googleLogin()}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10 transition"
              >
                Continue with Google
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-3 font-medium text-gray-400 hover:text-white transition"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-1 w-full"
          >
            <div className="relative rounded-xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden aspect-[4/3] max-w-2xl mx-auto flex flex-col">
              <div className="flex items-center gap-2 border-b border-white/5 bg-gray-950 p-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 text-xs font-mono text-gray-500">main.ts</div>
              </div>
              <div className="flex-1 p-4 font-mono text-sm text-gray-300 relative">
                <span className="text-pink-400">function</span>{' '}
                <span className="text-blue-400">fibonacci</span>(n:{' '}
                <span className="text-yellow-300">number</span>):{' '}
                <span className="text-yellow-300">number</span> {'{'}
                <br />
                {'  '}
                <span className="text-pink-400">if</span> (n {'<='} 1){' '}
                <span className="text-pink-400">return</span> n;
                <br />
                {'  '}
                <span className="text-pink-400">return</span> fibonacci(n - 1) + fibonacci(n - 2);
                <br />
                {'}'}
                <div className="absolute top-10 left-14 w-0.5 h-4 bg-emerald-500 animate-pulse" />
                <div className="absolute top-5 right-5 flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-gray-900 bg-blue-500 flex items-center justify-center text-xs font-bold">
                    JD
                  </div>
                  <div className="h-8 w-8 rounded-full border-2 border-gray-900 bg-emerald-500 flex items-center justify-center text-xs font-bold">
                    AS
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Everything you need to code together.
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              No setup required. Just share a link and start building.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="rounded-2xl border border-white/5 bg-gray-900/50 p-6 hover:bg-gray-900 transition-colors group"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-200">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl border border-white/10 bg-gray-900 overflow-hidden shadow-2xl"
          >
            <div className="flex border-b border-white/5 bg-gray-950 p-4 justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1 rounded">
                codesync.dev/room/a1b2c3
              </div>
              <div className="w-16" /> {/* spacer */}
            </div>
            <div className="grid grid-cols-4 h-[60vh] min-h-[400px]">
              <div className="col-span-1 border-r border-white/5 p-4 space-y-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Explorer
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-blue-400" /> src
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <Code2 className="h-4 w-4 text-yellow-400" /> index.js
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <Code2 className="h-4 w-4 text-blue-400" /> utils.ts
                  </div>
                </div>
              </div>
              <div className="col-span-3 flex flex-col">
                <div className="flex-1 p-6 font-mono text-sm bg-gray-950 relative overflow-hidden">
                  <div className="text-gray-500">// Start coding here</div>
                  <br />
                  <div className="text-pink-400">import</div> {'{'} serve {'}'}{' '}
                  <div className="text-pink-400">from</div>{' '}
                  <span className="text-green-300">"server"</span>;
                  <br />
                  <br />
                  serve(3000, () {'=>'} console.log(
                  <span className="text-green-300">"Running..."</span>));
                </div>
                <div className="h-1/3 border-t border-white/5 bg-gray-900 p-4 font-mono text-sm">
                  <div className="text-gray-500 flex justify-between">
                    <span>Terminal</span>
                    <span className="text-green-400">● Online</span>
                  </div>
                  <div className="mt-2 text-gray-300">$ node src/index.js</div>
                  <div className="text-white">Running...</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Compare Section */}
        <section id="compare" className="py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">How we compare</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 font-semibold text-gray-300">Feature</th>
                  <th className="p-4 font-semibold text-white bg-white/5 rounded-tl-lg">
                    CodeSync
                  </th>
                  <th className="p-4 font-semibold text-gray-400">LeetCode</th>
                  <th className="p-4 font-semibold text-gray-400">VSCode Live Share</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 divide-y divide-white/5">
                {[
                  ['Live collaboration', '✅', '❌', '✅'],
                  ['Shared execution', '✅', '❌', '❌'],
                  ['Whiteboard', '✅', '❌', '❌'],
                  ['Multiple files', '✅', '❌', '✅'],
                  ['Browser based', '✅', '✅', '❌'],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">{row[0]}</td>
                    <td className="p-4 text-center bg-white/5">{row[1]}</td>
                    <td className="p-4 text-center">{row[2]}</td>
                    <td className="p-4 text-center">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-24 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">About CodeSync</h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            CodeSync was built to bridge the gap between simple text-sharing platforms and complex
            local setups. Whether you are conducting a DSA interview, pair programming on a side
            project, teaching a classroom, or practicing competitive programming, CodeSync provides
            a frictionless, zero-setup environment tailored for technical collaboration.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-gray-950 py-12 relative z-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <Code2 className="h-6 w-6 text-gray-400" />
            <span className="text-lg font-semibold text-gray-300">CodeSync</span>
          </div>
          <div className="flex space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-300 transition">
              Documentation
            </a>
            <a href="#" className="hover:text-gray-300 transition">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-300 transition">
              Terms
            </a>
            <a href="https://github.com" className="hover:text-gray-300 transition">
              GitHub
            </a>
          </div>
          <div className="text-sm text-gray-500">
            Made with <span className="text-red-500">❤️</span> using React, Fastify, Socket.IO &
            Docker.
          </div>
        </div>
      </footer>
    </div>
  );
}
