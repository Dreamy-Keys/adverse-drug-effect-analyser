'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import useAuthStore from '../../lib/store/authStore';
import { Pill, ShieldCheck, Bell, Search, Activity, TrendingUp, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, token, init, loading: authLoading } = useAuthStore();
  const [meds, setMeds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const router = useRouter();

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch('/api/medications', { headers }).then(r => r.json()).then(d => setMeds(d.medications || [])).catch(() => {});
    fetch('/api/alerts', { headers }).then(r => r.json()).then(d => setAlerts(d.alerts || [])).catch(() => {});
    fetch('/api/drugs/search?stats=true').then(r => r.json()).then(setStats).catch(() => {});
  }, [token]);

  if (authLoading || !user) return <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" /></div>;

  const activeMeds = meds.filter(m => m.active);
  const unreadAlerts = alerts.filter(a => !a.read);
  const quickActions = [
    { icon: Search, label: 'Search Drugs', href: '/search', color: 'from-[#00d4ff] to-[#0ea5e9]' },
    { icon: ShieldCheck, label: 'Check Interactions', href: '/interactions', color: 'from-[#10b981] to-[#059669]' },
    { icon: Pill, label: 'Add Medication', href: '/tracker', color: 'from-[#8b5cf6] to-[#7c3aed]' },
    { icon: Bell, label: 'View Alerts', href: '/alerts', color: 'from-[#f59e0b] to-[#d97706]' },
  ];

  return (
    <main className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
          <h1 className="font-['Poppins'] font-bold text-2xl md:text-4xl text-white mb-2">
            Welcome back, <span className="gradient-text-static">{user.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-white/40 mb-10">Your drug safety dashboard</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Pill, label: 'Active Medications', value: activeMeds.length, color: 'text-[#00d4ff]' },
            { icon: Bell, label: 'Unread Alerts', value: unreadAlerts.length, color: 'text-[#f59e0b]' },
            { icon: Activity, label: 'Drugs in Database', value: stats.totalDrugs || 0, color: 'text-[#10b981]' },
            { icon: AlertTriangle, label: 'Interactions Mapped', value: stats.totalInteractions || 0, color: 'text-[#ef4444]' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}>
              <div className="glass-card p-5">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                <div className="text-2xl font-bold text-white font-['Poppins']">{stat.value.toLocaleString()}</div>
                <div className="text-white/40 text-xs mt-1">{stat.label}</div>
              </div>
            </motion.div>))}
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }} className="mb-10">
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href} className="glass-card p-4 flex items-center gap-3 group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-sm font-medium group-hover:text-[#00d4ff] transition-colors">{action.label}</span>
              </Link>))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Medications */}
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}>
            <div className="glass-card-static p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2"><Pill className="w-5 h-5 text-[#00d4ff]" /> Medications</h2>
                <Link href="/tracker" className="text-[#00d4ff] text-sm hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
              </div>
              {activeMeds.length === 0 ? (
                <div className="py-8 text-center"><Pill className="w-8 h-8 text-white/10 mx-auto mb-2" /><p className="text-white/30 text-sm">No medications tracked yet</p>
                  <Link href="/tracker" className="text-[#00d4ff] text-sm mt-2 inline-block hover:underline">Add your first medication →</Link></div>
              ) : (
                <div className="space-y-2">{activeMeds.slice(0,5).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div><p className="text-white text-sm font-medium">{m.drugName}</p><p className="text-white/30 text-xs">{m.dosage} • {m.schedule}</p></div>
                    <span className="badge badge-info text-[10px]">Active</span>
                  </div>))}</div>)}
            </div>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.5 }}>
            <div className="glass-card-static p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-[#f59e0b]" /> Alerts</h2>
                <Link href="/alerts" className="text-[#00d4ff] text-sm hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
              </div>
              {alerts.length === 0 ? (
                <div className="py-8 text-center"><Bell className="w-8 h-8 text-white/10 mx-auto mb-2" /><p className="text-white/30 text-sm">No alerts yet</p></div>
              ) : (
                <div className="space-y-2">{alerts.slice(0,5).map(a => (
                  <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${a.read?'bg-white/[0.01] border-white/[0.04]':'bg-[#f59e0b]/5 border-[#f59e0b]/20'}`}>
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.read?'text-white/30':'text-[#f59e0b]'}`} />
                    <div><p className="text-white text-sm">{a.message}</p><p className="text-white/30 text-xs mt-1">{new Date(a.createdAt).toLocaleDateString()}</p></div>
                  </div>))}</div>)}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
