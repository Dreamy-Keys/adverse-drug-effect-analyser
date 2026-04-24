'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import useAuthStore from '../../lib/store/authStore';
import { Bell, AlertTriangle, ShieldAlert, Clock, Check, Trash2, X } from 'lucide-react';

const typeIcons = { recall: ShieldAlert, interaction: AlertTriangle, expiry: Clock };
const typeColors = { recall: 'badge-danger', interaction: 'badge-warning', expiry: 'badge-info' };

export default function AlertsPage() {
  const { user, token, init, loading: authLoading } = useAuthStore();
  const [alerts, setAlerts] = useState([]);
  const router = useRouter();

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const fetchAlerts = () => {
    if (!token) return;
    fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setAlerts(d.alerts || [])).catch(() => {});
  };
  useEffect(fetchAlerts, [token]);

  const markRead = async (id) => {
    await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ alertId: id, action: 'read' }) });
    fetchAlerts();
  };

  const dismiss = async (id) => {
    await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ alertId: id, action: 'dismiss' }) });
    fetchAlerts();
  };

  if (authLoading || !user) return <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" /></div>;

  const unread = alerts.filter(a => !a.read);
  const read = alerts.filter(a => a.read);

  return (
    <main className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="mb-10">
          <h1 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-2">Alerts & <span className="gradient-text-static">Notifications</span></h1>
          <p className="text-white/40">Drug recalls, interaction warnings, and medication reminders</p>
        </motion.div>

        {alerts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-lg mb-2">No alerts</p>
            <p className="text-white/20 text-sm">You're all caught up! Alerts will appear here when there are drug safety updates.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {unread.length > 0 && (
              <div>
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" /> Unread ({unread.length})</h2>
                <div className="space-y-3">
                  {unread.map((alert, i) => {
                    const Icon = typeIcons[alert.type] || Bell;
                    return (
                      <motion.div key={alert.id} initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.05 }}>
                        <div className="glass-card p-5 border border-[#f59e0b]/20 bg-[#f59e0b]/5">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-[#f59e0b]" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`badge ${typeColors[alert.type] || 'badge-info'} text-[10px]`}>{alert.type}</span>
                                {alert.drugName && <span className="text-white/40 text-xs">{alert.drugName}</span>}
                              </div>
                              <p className="text-white text-sm">{alert.message}</p>
                              <p className="text-white/30 text-xs mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={()=>markRead(alert.id)} className="p-2 text-white/30 hover:text-green-400 rounded-lg hover:bg-white/5 transition-all" title="Mark read"><Check className="w-4 h-4" /></button>
                              <button onClick={()=>dismiss(alert.id)} className="p-2 text-white/30 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all" title="Dismiss"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      </motion.div>);
                  })}
                </div>
              </div>)}

            {read.length > 0 && (
              <div>
                <h2 className="text-white/60 font-semibold mb-4">Read ({read.length})</h2>
                <div className="space-y-2">
                  {read.map(alert => {
                    const Icon = typeIcons[alert.type] || Bell;
                    return (
                      <div key={alert.id} className="glass-card-static p-4 opacity-60">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-white/30" />
                          <p className="text-white/50 text-sm flex-1">{alert.message}</p>
                          <button onClick={()=>dismiss(alert.id)} className="p-1 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>);
                  })}
                </div>
              </div>)}
          </div>)}
      </div>
      <Footer />
    </main>
  );
}
