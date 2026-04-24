'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../lib/store/authStore';
import Navbar from '../../components/layout/Navbar';
import { User, Mail, Lock, ArrowRight, Shield, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [allergies, setAllergies] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const allergyList = allergies ? allergies.split(',').map(a => a.trim()).filter(Boolean) : [];
      await register(name, email, password, allergyList);
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
        <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-[#10b981]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[300px] h-[300px] bg-[#00d4ff]/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-[72px] pb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-['Poppins']">Create Account</h1>
                <p className="text-white/40 text-sm">Join MedGuard AI for free</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="input-glass !pl-11" required />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email or Username" className="input-glass !pl-11" required />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-glass !pl-11" required />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Known Allergies <span className="text-white/30">(optional)</span></label>
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g., Penicillin, Aspirin" className="input-glass" />
                <p className="text-white/25 text-xs mt-1.5">Separate multiple allergies with commas</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[#00d4ff] hover:text-[#00d4ff]/80 font-medium">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
