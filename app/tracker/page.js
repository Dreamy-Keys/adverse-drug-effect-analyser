'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import useAuthStore from '../../lib/store/authStore';
import { Pill, Plus, X, Calendar, Clock, Check, Trash2, Search, ChevronRight, Loader2, BarChart3, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function TrackerPage() {
  const { user, token, init, loading: authLoading } = useAuthStore();
  const [meds, setMeds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [drugsList, setDrugsList] = useState([{ name: '', dosage: '' }]);
  const [schedule, setSchedule] = useState('daily');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [ageRisk, setAgeRisk] = useState(null);
  const [detectedAllergies, setDetectedAllergies] = useState([]);
  const [checkingRisk, setCheckingRisk] = useState(false);
  const debRef = useRef(null);
  const riskDebRef = useRef(null);
  const router = useRouter();

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const fetchMeds = () => {
    if (!token) return;
    fetch('/api/medications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMeds(d.medications || [])).catch(() => {});
  };
  
  useEffect(() => {
    if (token) {
      fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setUserProfile).catch(() => {});
    }
  }, [token]);

  useEffect(fetchMeds, [token]);

  useEffect(() => {
    const primaryDrug = drugsList[0]?.name || '';
    if (primaryDrug.length < 2) { setSuggestions([]); setAgeRisk(null); return; }
    
    // Autocomplete search (based on the first drug for now)
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      fetch(`/api/drugs/search?q=${encodeURIComponent(primaryDrug)}&autocomplete=true`)
        .then(r => r.json()).then(d => { setSuggestions(d.suggestions || []); setShowSugg(true); });
    }, 200);

    // Age risk check (based on the primary drug)
    if (userProfile?.age) {
      clearTimeout(riskDebRef.current);
      riskDebRef.current = setTimeout(async () => {
        setCheckingRisk(true);
        try {
          const res = await fetch(`/api/age-risk/${encodeURIComponent(primaryDrug)}?age=${userProfile.age}`);
          const data = await res.json();
          if (data.riskLevel === 'high') setAgeRisk(data);
          else setAgeRisk(null);
        } catch { setAgeRisk(null); }
        finally { setCheckingRisk(false); }
      }, 500);
    }
  }, [drugsList[0]?.name, userProfile?.age]);

  // Allergy Check
  useEffect(() => {
    if (!userProfile?.allergies) return;
    const matches = drugsList
      .map(d => d.name.trim().toLowerCase())
      .filter(name => name.length > 1)
      .filter(name => userProfile.allergies.some(a => 
        name.includes(a.toLowerCase()) || a.toLowerCase().includes(name)
      ));
    setDetectedAllergies([...new Set(matches)]);
  }, [drugsList, userProfile?.allergies]);

  const addDrugField = () => setDrugsList([...drugsList, { name: '', dosage: '' }]);
  const updateDrug = (index, field, value) => {
    const newDrugs = [...drugsList];
    newDrugs[index][field] = value;
    setDrugsList(newDrugs);
  };
  const removeDrugField = (index) => {
    if (drugsList.length > 1) {
      setDrugsList(drugsList.filter((_, i) => i !== index));
    }
  };

  const addMed = async (e) => {
    e.preventDefault();
    // Filter out empty drugs
    const validDrugs = drugsList.filter(d => d.name.trim() !== '');
    if (validDrugs.length === 0) return;
    
    // Combine them for the backend: "Aspirin (50mg) + Tylenol (100mg)"
    const combinedName = validDrugs.map(d => d.dosage ? `${d.name.trim()} (${d.dosage})` : d.name.trim()).join(' + ');
    
    setSaving(true);
    try {
      await fetch('/api/medications', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ drugName: combinedName, dosage: validDrugs.length > 1 ? 'Combo Set' : validDrugs[0].dosage, schedule }),
      });
      setDrugsList([{ name: '', dosage: '' }]); setSchedule('daily'); setShowForm(false); fetchMeds();
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Add Medication Regimen</h3>
                  {drugsList.length > 1 && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">Combination Set</span>}
                </div>
                
                <div className="space-y-3 mb-4">
                  {drugsList.map((drug, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-start bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                      <div className="relative flex-1 w-full">
                        <input value={drug.name} onChange={e=>updateDrug(index, 'name', e.target.value)} placeholder={`Drug ${index + 1} (e.g., Aspirin)`} className="input-glass w-full" required />
                        {index === 0 && showSugg && suggestions.length > 0 && (
                          <div className="absolute top-full mt-1 w-full glass-card-static overflow-hidden z-20">
                            {suggestions.slice(0,5).map((s,i)=>(
                              <button type="button" key={i} onClick={()=>{updateDrug(0, 'name', s.name);setShowSugg(false)}} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5">{s.name}</button>))}
                          </div>)}
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <input value={drug.dosage} onChange={e=>updateDrug(index, 'dosage', e.target.value)} placeholder="Dosage (Optional)" className="input-glass flex-1 md:w-32" />
                        {drugsList.length > 1 && (
                          <button type="button" onClick={() => removeDrugField(index)} className="p-3 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={addDrugField} className="text-[#00d4ff] text-xs font-medium flex items-center gap-1 hover:text-[#00d4ff]/80 transition-colors py-2">
                    <Plus className="w-3 h-3" /> Add another drug to this regimen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">Schedule</label>
                    <select value={schedule} onChange={e=>setSchedule(e.target.value)} className="input-glass w-full">
                      <option value="daily">Daily</option>
                      <option value="twice-daily">Twice Daily (e.g., Breakfast & Dinner)</option>
                      <option value="three-daily">Three times a day</option>
                      <option value="weekly">Weekly</option>
                      <option value="as-needed">As Needed</option>
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {detectedAllergies.length > 0 && (
                    <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/40 flex gap-4">
                      <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="text-red-400 font-bold text-sm">Drug Allergy Warning</h4>
                        <p className="text-white/80 text-xs mt-1 leading-relaxed">
                          You are attempting to add <span className="font-bold text-white uppercase">{detectedAllergies.join(', ')}</span> which matches your reported allergies: <span className="font-bold text-red-400">{userProfile.allergies.join(', ')}</span>.
                        </p>
                        <p className="text-white/40 text-[10px] mt-2 italic">Please confirm with your physician before proceeding.</p>
                      </div>
                    </motion.div>
                  )}

                  {ageRisk && !detectedAllergies.length && (
                    <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-4">
                      <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="text-red-400 font-bold text-sm">High Risk Warning for Your Age ({userProfile.age}y)</h4>
                        <p className="text-white/60 text-xs mt-1 leading-relaxed">{ageRisk.explanation}</p>
                        <div className="flex gap-2 mt-3">
                          {ageRisk.recommendedAction?.slice(0,2).map((a,i)=>(
                            <span key={i} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-medium">{a}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
