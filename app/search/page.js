'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Search, X, AlertTriangle, Activity, Pill, ChevronRight, Beaker, Loader2, Star, Wine, Baby, Stethoscope } from 'lucide-react';

function DrugDetailPanel({ drug, onClose }) {
  if (!drug) return null;
  const topSideEffects = drug.sideEffects?.slice(0, 15) || [];
  const maxCount = topSideEffects[0]?.count || 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()} className="glass-card-static w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-['Poppins']">{drug.drugName}</h2>
            {drug.brandNames?.length > 0 && <p className="text-[#00d4ff]/70 text-sm mt-1">{drug.brandNames.slice(0,3).join(', ')}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="glass-card-static p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm font-medium">Risk Score</span>
            <span className={`badge ${drug.riskScore >= 70 ? 'badge-danger' : drug.riskScore >= 40 ? 'badge-warning' : 'badge-success'}`}>
              {drug.riskScore >= 70 ? 'High Risk' : drug.riskScore >= 40 ? 'Moderate' : 'Low Risk'}
            </span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2.5">
            <div className={`h-2.5 rounded-full transition-all duration-1000 ${drug.riskScore >= 70 ? 'bg-red-500' : drug.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${drug.riskScore}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30"><span>{drug.eventCount} events</span><span>{drug.seriousEventCount} serious</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {drug.genericNames?.length > 0 && <div className="glass-card-static p-3"><div className="text-white/40 text-xs mb-1">Generic</div><div className="text-white text-sm font-medium">{drug.genericNames[0]}</div></div>}
          {drug.drugClass?.length > 0 && <div className="glass-card-static p-3"><div className="text-white/40 text-xs mb-1">Class</div><div className="text-white text-sm font-medium truncate">{drug.drugClass[0]}</div></div>}
          {drug.routes?.length > 0 && <div className="glass-card-static p-3"><div className="text-white/40 text-xs mb-1">Route</div><div className="text-white text-sm font-medium">{drug.routes.join(', ')}</div></div>}
          {drug.manufacturers?.length > 0 && <div className="glass-card-static p-3"><div className="text-white/40 text-xs mb-1">Manufacturer</div><div className="text-white text-sm font-medium truncate">{drug.manufacturers[0]}</div></div>}
        </div>

        {/* ── Kaggle Enrichment: Rating, Pregnancy, Rx/OTC, Alcohol ── */}
        {(drug.userRating || drug.pregnancyCategory || drug.rxOtc || drug.alcoholInteraction) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {drug.userRating && (
              <div className="glass-card-static p-3 text-center">
                <Star className="w-4 h-4 text-[#f59e0b] mx-auto mb-1.5" />
                <div className="text-white font-semibold text-lg">{drug.userRating}</div>
                <div className="text-white/30 text-[10px]">User Rating</div>
              </div>
            )}
            {drug.pregnancyCategory && drug.pregnancyCategory !== 'N' && (
              <div className="glass-card-static p-3 text-center">
                <Baby className="w-4 h-4 text-[#f472b6] mx-auto mb-1.5" />
                <div className={`font-bold text-lg ${drug.pregnancyCategory === 'X' ? 'text-red-400' : drug.pregnancyCategory === 'D' ? 'text-orange-400' : 'text-white'}`}>
                  Cat. {drug.pregnancyCategory}
                </div>
                <div className="text-white/30 text-[10px]">Pregnancy</div>
              </div>
            )}
            {drug.rxOtc && (
              <div className="glass-card-static p-3 text-center">
                <Stethoscope className="w-4 h-4 text-[#00d4ff] mx-auto mb-1.5" />
                <div className="text-white font-semibold text-lg">{drug.rxOtc}</div>
                <div className="text-white/30 text-[10px]">{drug.rxOtc === 'Rx' ? 'Prescription' : drug.rxOtc === 'OTC' ? 'Over-the-counter' : 'Classification'}</div>
              </div>
            )}
            {drug.alcoholInteraction && (
              <div className="glass-card-static p-3 text-center border border-red-500/20">
                <Wine className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
                <div className="text-red-400 font-bold text-sm">⚠ Avoid</div>
                <div className="text-white/30 text-[10px]">Alcohol</div>
              </div>
            )}
          </div>
        )}

        {drug.indications?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white/60 text-sm font-semibold mb-3 flex items-center gap-2"><Beaker className="w-4 h-4" /> Indications</h3>
            <div className="flex flex-wrap gap-2">{drug.indications.slice(0,8).map((ind,i) => <span key={i} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs">{ind}</span>)}</div>
          </div>
        )}

        {topSideEffects.length > 0 && (
          <div>
            <h3 className="text-white/60 text-sm font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Top Side Effects</h3>
            <div className="space-y-2">
              {topSideEffects.map((se, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/50 text-xs w-[180px] truncate shrink-0">{se.name}</span>
                  <div className="flex-1 bg-white/[0.04] rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(se.count / maxCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={`h-2 rounded-full ${i < 3 ? 'bg-red-500/70' : i < 7 ? 'bg-yellow-500/70' : 'bg-[#00d4ff]/50'}`} />
                  </div>
                  <span className="text-white/30 text-xs w-8 text-right">{se.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/drugs/search?q=${encodeURIComponent(query)}&autocomplete=true`)
        .then(r => r.json()).then(data => { setSuggestions(data.suggestions || []); setShowSuggestions(true); });
    }, 200);
  }, [query]);

  const handleSearch = useCallback(async (sq) => {
    const q = sq || query;
    setLoading(true); setShowSuggestions(false);
    try {
      const res = await fetch(`/api/drugs/search?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json(); setResults(data.results || []);
    } catch {} finally { setLoading(false); }
  }, [query]);

  const viewDrug = async (drug) => {
    try { const r = await fetch(`/api/drugs/${encodeURIComponent(drug.id)}`); setSelectedDrug(await r.json()); } catch { setSelectedDrug(drug); }
  };

  useEffect(() => { handleSearch(''); }, []);

  return (
    <main className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="text-center mb-12">
          <h1 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-4">Drug <span className="gradient-text-static">Search Engine</span></h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Search across 3,800+ drugs by brand name, generic name, or drug class</p>
        </motion.div>

        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }} className="relative max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
            <input type="text" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}
              onFocus={()=>suggestions.length>0&&setShowSuggestions(true)}
              placeholder="Search by drug name, brand, or class..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl py-4 pr-28 text-white text-base focus:border-[#00d4ff]/50 focus:shadow-[0_0_30px_rgba(0,212,255,0.1)] outline-none transition-all placeholder:text-white/25" style={{ paddingLeft: '3rem' }} />
            <button onClick={()=>handleSearch()} className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2.5 !px-5 !rounded-xl text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div initial={{ opacity:0,y:-5 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }} className="absolute top-full mt-2 w-full glass-card-static overflow-hidden z-20">
                {suggestions.map((s,i) => (
                  <button key={i} onClick={()=>{setQuery(s.name);setShowSuggestions(false);handleSearch(s.name);}}
                    className="w-full text-left px-5 py-3 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div><span className="text-white text-sm font-medium">{s.name}</span>
                      {s.brandNames?.[0] && <span className="text-white/30 text-xs ml-2">({s.brandNames[0]})</span>}</div>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </button>))}
              </motion.div>)}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((drug, i) => (
            <motion.div key={drug.id} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.03 }}>
              <div onClick={()=>viewDrug(drug)} className="glass-card p-5 cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#10b981]/20 border border-[#00d4ff]/20 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-[#00d4ff]" /></div>
                    <div><h3 className="text-white font-semibold text-sm group-hover:text-[#00d4ff] transition-colors">{drug.drugName}</h3>
                      {drug.brandNames?.[0] && <p className="text-white/30 text-xs">{drug.brandNames[0]}</p>}</div>
                  </div>
                  <span className={`badge text-[10px] ${drug.riskScore>=70?'badge-danger':drug.riskScore>=40?'badge-warning':'badge-success'}`}>{drug.riskScore}%</span>
                </div>
                {drug.genericNames?.[0] && <p className="text-white/40 text-xs mb-2">Generic: {drug.genericNames[0]}</p>}
                {(drug.rxOtc || drug.userRating || drug.pregnancyCategory) && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {drug.rxOtc && <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${drug.rxOtc === 'Rx' ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20' : 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20'}`}>{drug.rxOtc}</span>}
                    {drug.userRating > 0 && <span className="flex items-center gap-1 text-[10px] text-[#f59e0b]/80"><Star className="w-3 h-3" />{drug.userRating}</span>}
                    {drug.pregnancyCategory && drug.pregnancyCategory !== 'N' && <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${drug.pregnancyCategory === 'X' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/[0.04] text-white/50 border border-white/[0.08]'}`}>Preg: {drug.pregnancyCategory}</span>}
                    {drug.alcoholInteraction && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">🍷 Alcohol</span>}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1 text-white/30 text-xs"><Activity className="w-3 h-3" />{drug.eventCount} events</div>
                  <div className="flex items-center gap-1 text-white/30 text-xs"><AlertTriangle className="w-3 h-3" />{drug.seriousEventCount} serious</div>
                </div>
              </div>
            </motion.div>))}
        </div>
        {results.length===0&&!loading&&<div className="text-center py-20"><Search className="w-12 h-12 text-white/10 mx-auto mb-4" /><p className="text-white/30 text-lg">No drugs found</p></div>}
      </div>
      <AnimatePresence>{selectedDrug && <DrugDetailPanel drug={selectedDrug} onClose={()=>setSelectedDrug(null)} />}</AnimatePresence>
      <Footer />
    </main>
  );
}
