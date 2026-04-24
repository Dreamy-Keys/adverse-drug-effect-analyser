'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import useAuthStore from '../../lib/store/authStore';
import { ShieldCheck, X, Plus, AlertTriangle, Loader2, Search, ChevronRight, Info, AlertCircle } from 'lucide-react';

const severityColors = { critical:'badge-danger', high:'badge-danger', moderate:'badge-warning', low:'badge-success', none:'badge-info' };
const severityBg = { critical:'border-red-500/30 bg-red-500/5', high:'border-red-500/20 bg-red-500/5', moderate:'border-yellow-500/20 bg-yellow-500/5', low:'border-green-500/20 bg-green-500/5' };

export default function InteractionsPage() {
  const { user, token, init } = useAuthStore();
  const [drugs, setDrugs] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [results, setResults] = useState(null);
  const [ddiPrediction, setDdiPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [detectedAllergies, setDetectedAllergies] = useState([]);
  const debRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setUserProfile).catch(() => {});
    }
  }, [token]);

  // Allergy Check
  useEffect(() => {
    const allergies = userProfile?.allergies || user?.allergies || [];
    if (allergies.length === 0) return;
    
    const matches = drugs.filter(name => 
      allergies.some(a => name.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(name.toLowerCase()))
    );
    setDetectedAllergies([...new Set(matches)]);
  }, [drugs, userProfile?.allergies, user?.allergies]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSugg(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (input.length < 2) { setSuggestions([]); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      fetch(`/api/drugs/search?q=${encodeURIComponent(input)}&autocomplete=true`)
        .then(r => r.json()).then(d => { setSuggestions(d.suggestions || []); setShowSugg(true); });
    }, 200);
  }, [input]);

  const addDrug = (name) => {
    if (drugs.length >= 30 || drugs.includes(name)) return;
    setDrugs([...drugs, name]); setInput(''); setShowSugg(false); setResults(null); setDdiPrediction(null);
  };

  const removeDrug = (name) => { setDrugs(drugs.filter(d => d !== name)); setResults(null); setDdiPrediction(null); };

  const checkInteractions = async () => {
    if (drugs.length < 2) return;
    setLoading(true);
    setDdiPrediction(null);
    try {
      const res = await fetch('/api/interactions/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drugs }) });
      setResults(await res.json());

      // Only run deep ML prediction if exactly 2 drugs
      if (drugs.length === 2) {
        const mlRes = await fetch('/api/predict/ddi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drug1: drugs[0], drug2: drugs[1] }) });
        setDdiPrediction(await mlRes.json());
      }
    } catch {} finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="text-center mb-12">
          <h1 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-4">Interaction <span className="gradient-text-static">Checker</span></h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Check up to 30 drugs for potential interactions based on real FDA adverse event data</p>
        </motion.div>

        {/* Drug Input */}
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }} className="glass-card p-6 md:p-8 mb-8">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-[#00d4ff]" /> Add Drugs ({drugs.length}/30)</h2>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){addDrug(input.trim().toUpperCase())}}}
              placeholder="Type drug name..." className="input-glass !pl-11" />
            <AnimatePresence>
              {showSugg && suggestions.length > 0 && (
                <motion.div 
                  ref={suggestionsRef}
                  initial={{ opacity:0,y:-5 }} 
                  animate={{ opacity:1,y:0 }} 
                  exit={{ opacity:0,y:-5 }}
                  className="absolute top-full mt-2 w-full bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20"
                >
                  {suggestions.map((s,i) => (
                    <button key={i} onClick={()=>addDrug(s.name)} className="w-full text-left px-5 py-3 hover:bg-white/5 transition-colors flex items-center justify-between">
                      <span className="text-white text-sm">{s.name}</span><ChevronRight className="w-4 h-4 text-white/20" />
                    </button>))}
                </motion.div>)}
            </AnimatePresence>
          </div>

          {drugs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {drugs.map(d => (
                <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-sm">
                  {d} <button onClick={()=>removeDrug(d)} className="hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
                </span>))}
            </div>)}

          <AnimatePresence>
            {detectedAllergies.length > 0 && (
              <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-10 }} className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 flex gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                <div>
                  <h4 className="text-red-400 font-bold text-sm">Drug Allergy Warning</h4>
                  <p className="text-white/80 text-xs mt-1 leading-relaxed">
                    You have added <span className="font-bold text-white uppercase">{detectedAllergies.join(', ')}</span> which matches your reported allergies: <span className="font-bold text-red-400">{(userProfile?.allergies || user?.allergies || []).join(', ')}</span>.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={checkInteractions} disabled={drugs.length<2||loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-40">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Checking...' : 'Check Interactions'}
          </button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}>
              {/* Summary */}
              <div className={`glass-card p-6 mb-6 border ${results.overallRisk==='none'?'border-green-500/20':'border-red-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Analysis Complete</h3>
                    <p className="text-white/40 text-sm mt-1">{results.interactionCount} interaction(s) found across {results.drugsChecked?.length} drugs</p>
                  </div>
                  <span className={`badge ${severityColors[results.overallRisk] || 'badge-info'} text-sm !px-4 !py-2`}>
                    {results.overallRisk === 'none' ? '✓ No Interactions' : `⚠ ${results.overallRisk.charAt(0).toUpperCase()+results.overallRisk.slice(1)} Risk`}
                  </span>
                </div>
              </div>

              {/* Interaction Cards */}
              {results.interactions?.length > 0 && (
                <div className="space-y-4">
                  {results.interactions.map((inter, i) => (
                    <motion.div key={i} initial={{ opacity:0,y:15 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}
                      className={`glass-card-static p-5 border ${severityBg[inter.severity] || ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-5 h-5 ${inter.severity==='critical'||inter.severity==='high'?'text-red-400':inter.severity==='moderate'?'text-yellow-400':'text-green-400'}`} />
                          <div>
                            <h4 className="text-white font-semibold text-sm">{inter.drug1Name} + {inter.drug2Name}</h4>
                            <p className="text-white/30 text-xs mt-0.5">Co-occurred in {inter.coOccurrenceCount} report(s)</p>
                          </div>
                        </div>
                        <span className={`badge ${severityColors[inter.severity]}`}>{inter.severity}</span>
                      </div>
                      <p className="text-white/50 text-sm mb-3">{inter.description}</p>
                      {inter.sharedReactions?.length > 0 && (
                        <div>
                          <p className="text-white/40 text-xs font-medium mb-2">Shared Adverse Reactions:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {inter.sharedReactions.slice(0,6).map((r,j) => (
                              <span key={j} className="px-2 py-1 rounded bg-white/[0.04] text-white/50 text-xs">{r.name} ({r.count})</span>))}
                          </div>
                        </div>)}
                    </motion.div>))}
                </div>)}

              {/* ── ML DDI Prediction ── */}
              {ddiPrediction && ddiPrediction.status === 'success' && (
                <div className="mt-8 border-t border-purple-500/20 pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> AI Interaction Predictor
                    </div>
                  </div>
                  
                  <div className={`glass-card p-6 border ${ddiPrediction.predictedSeverity === 'high' ? 'border-red-500/30' : ddiPrediction.predictedSeverity === 'moderate' ? 'border-yellow-500/30' : 'border-purple-500/30'}`}>
                    <h3 className="text-white font-semibold text-lg mb-2">Predictive Co-occurrence Model</h3>
                    <p className="text-white/60 text-sm mb-4 leading-relaxed">{ddiPrediction.message}</p>
                    
                    {ddiPrediction.topCompoundedRisks && ddiPrediction.topCompoundedRisks.length > 0 && (
                      <div>
                        <h4 className="text-white/40 text-xs font-semibold mb-3 uppercase tracking-wider">Top Compounded Side Effects</h4>
                        <div className="space-y-2">
                          {ddiPrediction.topCompoundedRisks.map((risk, idx) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg flex items-center justify-between">
                              <span className="text-white text-sm font-medium">{risk.reaction}</span>
                              <div className="text-right">
                                <span className="text-[10px] text-white/40 block mb-1">Individual Frequencies:</span>
                                <span className="text-xs font-mono text-purple-400">{drugs[0]}: {risk.d1Freq}% | {drugs[1]}: {risk.d2Freq}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {results.interactionCount === 0 && (
                <div className="glass-card p-8 text-center border border-green-500/20">
                  <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold text-lg mb-2">No Interactions Detected</h3>
                  <p className="text-white/40 text-sm">These drugs were not found co-occurring in adverse event reports.</p>
                  <p className="text-white/25 text-xs mt-3 flex items-center justify-center gap-1"><Info className="w-3 h-3" /> Always consult your healthcare provider</p>
                </div>)}
            </motion.div>)}
        </AnimatePresence>
      </div>
      <Footer />
    </main>
  );
}
