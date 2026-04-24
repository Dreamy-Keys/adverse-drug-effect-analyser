'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../lib/store/authStore';
import Navbar from '../../components/layout/Navbar';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0e14] relative">
      <Navbar />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-[#00d4ff]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-[#10b981]/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-[72px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#10b981] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-['Poppins']">Welcome Back</h1>
                <p className="text-white/40 text-sm">Sign in to MedGuard AI</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-glass !pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glass !pl-11"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#00d4ff] hover:text-[#00d4ff]/80 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
