'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import useAuthStore from '../../lib/store/authStore';
import { Pill, Plus, X, Calendar, Clock, Check, Trash2, Search, ChevronRight, Loader2, BarChart3 } from 'lucide-react';

export default function TrackerPage() {
  const { user, token, init, loading: authLoading } = useAuthStore();
  const [meds, setMeds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [saving, setSaving] = useState(false);
  const debRef = useRef(null);
  const router = useRouter();

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const fetchMeds = () => {
    if (!token) return;
    fetch('/api/medications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMeds(d.medications || [])).catch(() => {});
  };
  useEffect(fetchMeds, [token]);

  useEffect(() => {
    if (drugName.length < 2) { setSuggestions([]); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      fetch(`/api/drugs/search?q=${encodeURIComponent(drugName)}&autocomplete=true`)
        .then(r => r.json()).then(d => { setSuggestions(d.suggestions || []); setShowSugg(true); });
    }, 200);
  }, [drugName]);

  const addMed = async (e) => {
    e.preventDefault();
    if (!drugName.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/medications', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ drugName: drugName.trim(), dosage, schedule }),
      });
      setDrugName(''); setDosage(''); setSchedule('daily'); setShowForm(false); fetchMeds();
    } catch {} finally { setSaving(false); }
  };

  const deleteMed = async (id) => {
    await fetch(`/api/medications?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchMeds();
  };

  const logDose = async (medId, taken) => {
    const today = new Date().toISOString().split('T')[0];
    await fetch('/api/medications', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'log', medId, date: today, taken }),
    });
    fetchMeds();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  if (authLoading || !user) return <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" /></div>;

  const adherenceRate = meds.length > 0 ? Math.round(meds.reduce((acc, m) => {
    const logs = m.adherenceLog || [];
    const taken = logs.filter(l => l.taken).length;
    return acc + (logs.length > 0 ? (taken / logs.length) * 100 : 0);
  }, 0) / meds.length) : 0;

  return (
    <main className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="flex items-start justify-between mb-10">
          <div>
            <h1 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-2">Medication <span className="gradient-text-static">Tracker</span></h1>
            <p className="text-white/40">Track medications, log doses, and monitor adherence</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 text-center"><Pill className="w-5 h-5 text-[#00d4ff] mx-auto mb-2" /><div className="text-2xl font-bold text-white">{meds.filter(m=>m.active).length}</div><div className="text-white/40 text-xs">Active</div></div>
          <div className="glass-card p-4 text-center"><Calendar className="w-5 h-5 text-[#10b981] mx-auto mb-2" /><div className="text-2xl font-bold text-white">{meds.reduce((a,m)=>(m.adherenceLog||[]).length+a,0)}</div><div className="text-white/40 text-xs">Doses Logged</div></div>
          <div className="glass-card p-4 text-center"><BarChart3 className="w-5 h-5 text-[#f59e0b] mx-auto mb-2" /><div className="text-2xl font-bold text-white">{adherenceRate}%</div><div className="text-white/40 text-xs">Adherence</div></div>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }} className="overflow-hidden mb-8">
              <form onSubmit={addMed} className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Add Medication</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input value={drugName} onChange={e=>setDrugName(e.target.value)} placeholder="Drug name" className="input-glass" required />
                    {showSugg && suggestions.length > 0 && (
                      <div className="absolute top-full mt-1 w-full glass-card-static overflow-hidden z-20">
                        {suggestions.slice(0,5).map((s,i)=>(
                          <button type="button" key={i} onClick={()=>{setDrugName(s.name);setShowSugg(false)}} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5">{s.name}</button>))}
                      </div>)}
                  </div>
                  <input value={dosage} onChange={e=>setDosage(e.target.value)} placeholder="Dosage (e.g., 50mg)" className="input-glass" />
                  <select value={schedule} onChange={e=>setSchedule(e.target.value)} className="input-glass">
                    <option value="daily">Daily</option><option value="twice-daily">Twice Daily</option>
                    <option value="weekly">Weekly</option><option value="as-needed">As Needed</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Medication
                  </button>
                  <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </motion.div>)}
        </AnimatePresence>

        {/* Medication List */}
        <div className="space-y-3">
          {meds.length === 0 ? (
            <div className="glass-card p-12 text-center"><Pill className="w-12 h-12 text-white/10 mx-auto mb-4" /><p className="text-white/30 text-lg mb-2">No medications yet</p><p className="text-white/20 text-sm">Add your first medication to start tracking</p></div>
          ) : meds.map((med, i) => {
            const todayLog = (med.adherenceLog||[]).find(l=>l.date===todayStr);
            return (
              <motion.div key={med.id} initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.05 }}>
                <div className="glass-card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todayLog?.taken ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                      {todayLog?.taken ? <Check className="w-5 h-5 text-green-400" /> : <Pill className="w-5 h-5 text-white/40" />}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{med.drugName}</h3>
                      <p className="text-white/30 text-xs">{med.dosage && `${med.dosage} • `}{med.schedule} {med.startDate && `• Since ${med.startDate}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!todayLog?.taken && (
                      <button onClick={()=>logDose(med.id, true)} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all flex items-center gap-1">
                        <Check className="w-3 h-3" /> Take
                      </button>)}
                    <button onClick={()=>deleteMed(med.id)} className="p-2 text-white/20 hover:text-red-400 rounded-lg hover:bg-white/5 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>);
          })}
        </div>
      </div>
      <Footer />
    </main>
  );
}
