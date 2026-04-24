'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Search, X, AlertTriangle, Activity, Pill, ChevronRight, Beaker, Loader2, Star, Wine, Baby, Stethoscope, Users, Info } from 'lucide-react';
import AgeRiskChart from '../../components/drug/AgeRiskChart';
import useAuthStore from '../../lib/store/authStore';

function DrugDetailPanel({ drug, onClose, userAge, userAllergies = [] }) {
  if (!drug) return null;
  const [ageRisk, setAgeRisk] = useState(null);
  const [ageProfile, setAgeProfile] = useState(null);
  const [selectedAge, setSelectedAge] = useState(userAge || 35);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [mlPrediction, setMlPrediction] = useState(null);

  // Allergy Check logic
  const allergyMatch = userAllergies.length > 0 ? userAllergies.filter(a => {
    const allergen = a.toLowerCase();
    const dName = drug.drugName.toLowerCase();
    const bNames = (drug.brandNames || []).map(b => b.toLowerCase());
    return dName.includes(allergen) || allergen.includes(dName) || bNames.some(b => b.includes(allergen));
  }) : [];

  useEffect(() => {
    async function fetchAgeRisk() {
      setLoadingRisk(true);
      try {
        const [riskRes, profileRes, predictionRes] = await Promise.all([
          fetch(`/api/age-risk/${encodeURIComponent(drug.id)}?age=${selectedAge}`),
          fetch(`/api/age-risk/${encodeURIComponent(drug.id)}?profile=true`),
          fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drug: drug.drugName })
          })
        ]);
        setAgeRisk(await riskRes.json());
        setAgeProfile(await profileRes.json());
        setMlPrediction(await predictionRes.json());
      } catch (err) {
        console.error('Failed to fetch age risk:', err);
      } finally {
        setLoadingRisk(false);
      }
    }
    fetchAgeRisk();
  }, [drug.id, selectedAge]);

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
            {drug.brandNames?.length > 0 && <p className="text-[#00d4ff]/70 text-sm mt-1">{drug.brandNames.slice(0, 3).join(', ')}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"><X className="w-5 h-5" /></button>
        </div>

        {allergyMatch.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <div>
              <h4 className="text-red-400 font-bold text-sm">Drug Allergy Warning</h4>
              <p className="text-white/80 text-xs mt-1 leading-relaxed">
                This medication matches your reported allergies: <span className="font-bold text-red-400 uppercase">{allergyMatch.join(', ')}</span>. 
                Taking this drug may cause a severe reaction.
              </p>
            </div>
          </div>
        )}

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

        {/* ── Age Risk Analysis Section ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00d4ff]" /> Age-Based Risk Analysis
            </h3>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1">
              <span className="text-[10px] text-white/40 uppercase font-bold">Age:</span>
              <input
                type="number"
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="bg-transparent text-white text-xs font-bold w-10 outline-none"
              />
            </div>
          </div>

          <div className="glass-card-static p-6 relative overflow-hidden">
            {loadingRisk && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
              </div>
            )}

            {ageRisk && (
              <div className="relative z-0">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white`} style={{ backgroundColor: ageRisk.riskColor }}>
                        {ageRisk.riskLevel} Risk ({ageRisk.riskScore})
                      </div>
                      <span className="text-white/40 text-xs font-medium">{ageRisk.ageGroup?.label} ({ageRisk.ageGroup?.range})</span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed mb-4">{ageRisk.explanation}</p>

                    <div className="space-y-2">
                      {ageRisk.recommendedAction?.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <div className="w-1 h-1 rounded-full bg-[#00d4ff] mt-1.5 shrink-0" />
                          {rec}
                        </div>
                      ))}
                    </div>

                    {/* Physiological Insight */}
                    <div className="mt-4 p-3 rounded-lg bg-[#00d4ff]/5 border border-[#00d4ff]/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                        <span className="text-[10px] text-[#00d4ff] uppercase font-black tracking-widest">Physiological Insight</span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed italic">
                        {ageRisk.ageGroup?.id === 'elderly' && "Elderly patients often experience reduced renal clearance and hepatic metabolism, increasing the risk of drug accumulation and toxicity. Lower starting doses are often recommended."}
                        {['neonate', 'infant', 'child'].includes(ageRisk.ageGroup?.id) && "Pediatric patients have developing metabolic enzymes and higher total body water. Dosing must be precisely calculated by weight to avoid severe adverse outcomes."}
                        {ageRisk.ageGroup?.id === 'adult' && "Standard adult metabolism assumed. However, individual variations in liver and kidney function can significantly alter drug processing and risk profile."}
                        {ageRisk.ageGroup?.id === 'adolescent' && "Transitioning metabolism. Hormonal changes and rapid growth may affect drug distribution and response consistency."}
                      </p>
                    </div>
                  </div>

                  {ageProfile && (
                    <div className="w-full md:w-[280px] shrink-0" style={{ minWidth: 0, minHeight: 0 }}>
                      <div className="text-[10px] text-white/30 uppercase font-bold mb-2 tracking-widest">Risk Across Age Groups</div>
                      <AgeRiskChart data={ageProfile.profile} selectedAgeGroup={ageRisk.ageGroup?.id} />
                    </div>
                  )}
                </div>

                {ageRisk.factors?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/[0.06]">
                    <div className="text-[10px] text-white/30 uppercase font-bold mb-3 tracking-widest">Risk Factor Breakdown</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ageRisk.factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <Info className="w-3.5 h-3.5 text-white/20 mt-0.5" />
                          <div>
                            <div className="text-white/80 text-xs font-medium">{f.factor}</div>
                            <div className="text-white/30 text-[10px] leading-tight mt-1">{f.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500/50 shrink-0 mt-0.5" />
              <p className="text-[10px] text-yellow-500/40 leading-tight italic">
                Disclaimer: This analysis is derived from FDA adverse event data and clinical guidelines.
                It is not a substitute for professional medical advice. Always consult your doctor before starting or changing medications.
              </p>
            </div>

            {/* ── Comparative ML Prediction ── */}
            {mlPrediction && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-3 h-3" />
                      Comparative Risk Model (Pediatric vs Adult)
                    </div>
                  </div>
                  {mlPrediction.status === 'success' && (
                    <div className="text-[10px] text-white/40 font-mono bg-white/[0.02] px-2 py-1 rounded">
                      N={mlPrediction.pediatricTotal} Pediatric | N={mlPrediction.adultTotal} Adult Cases
                    </div>
                  )}
                </div>

                {mlPrediction.status === 'success' && mlPrediction.comparativeRisks?.length > 0 ? (
                  <div className="space-y-4">
                    {mlPrediction.comparativeRisks.map((risk, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl relative overflow-hidden">
                        {risk.isHigherInKids && (
                          <div className="absolute top-0 right-0 bg-red-500/80 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                            ELEVATED PEDIATRIC RISK
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <span className="text-white text-sm font-semibold">{risk.reaction}</span>
                          <span className={`text-xs font-mono font-bold ${risk.isHigherInKids ? 'text-red-400' : 'text-green-400'}`}>
                            {risk.multiplierLabel}
                          </span>
                        </div>

                        {/* Comparison Bars */}
                        <div className="space-y-2 mt-3">
                          {/* Pediatric Bar */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-white/50 w-12 text-right uppercase font-bold tracking-wider">Child</span>
                            <div className="flex-1 bg-white/[0.04] h-2 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, parseFloat(risk.pediatricRisk) * 3)}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className={`h-full ${risk.isHigherInKids ? 'bg-red-500' : 'bg-purple-500'}`}
                              />
                            </div>
                            <span className="text-xs text-white/80 w-10 text-right font-mono">{risk.pediatricRisk}%</span>
                          </div>

                          {/* Adult Bar */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-white/50 w-12 text-right uppercase font-bold tracking-wider">Adult</span>
                            <div className="flex-1 bg-white/[0.04] h-2 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, parseFloat(risk.adultRisk) * 3)}%` }}
                                transition={{ duration: 1, delay: (i * 0.1) + 0.2 }}
                                className="h-full bg-[#00d4ff]/60"
                              />
                            </div>
                            <span className="text-xs text-white/80 w-10 text-right font-mono">{risk.adultRisk}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg flex items-center justify-center text-center">
                    <p className="text-white/40 text-xs">
                      {mlPrediction.message || "Not enough comparative data for this drug."}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Kaggle Enrichment: Rating, Pregnancy, Rx/OTC, Alcohol ── */}
        {(drug.userRating || drug.pregnancyCategory || drug.rxOtc || drug.alcoholInteraction) && (
          <div className="mb-8">
            <h3 className="text-white/60 text-sm font-semibold mb-4 flex items-center gap-2"><Star className="w-4 h-4" /> Clinical Metadata</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          </div>
        )}

        {drug.indications?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white/60 text-sm font-semibold mb-3 flex items-center gap-2"><Beaker className="w-4 h-4" /> Indications</h3>
            <div className="flex flex-wrap gap-2">{drug.indications.slice(0, 8).map((ind, i) => <span key={i} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs">{ind}</span>)}</div>
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
  const { user, init } = useAuthStore();
  const [userProfile, setUserProfile] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (user) {
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('medguard_token')}` }
      })
        .then(r => r.json())
        .then(setUserProfile)
        .catch(() => { });
    }
  }, [user]);

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
    } catch { } finally { setLoading(false); }
  }, [query]);

  const viewDrug = async (drug) => {
    try { const r = await fetch(`/api/drugs/${encodeURIComponent(drug.id)}`); setSelectedDrug(await r.json()); } catch { setSelectedDrug(drug); }
  };

  useEffect(() => { handleSearch(''); }, []);

  return (
    <main className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-4">Drug <span className="gradient-text-static">Search Engine</span></h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Search across 3,800+ drugs by brand name, generic name, or drug class</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search by drug name, brand, or class..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl py-4 pr-28 text-white text-base focus:border-[#00d4ff]/50 focus:shadow-[0_0_30px_rgba(0,212,255,0.1)] outline-none transition-all placeholder:text-white/25" style={{ paddingLeft: '3rem' }} />
            <button onClick={() => handleSearch()} className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2.5 !px-5 !rounded-xl text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }} 
                className="absolute top-full mt-2 w-full bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20"
              >
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setQuery(s.name); setShowSuggestions(false); handleSearch(s.name); }}
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
            <motion.div key={drug.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div onClick={() => viewDrug(drug)} className="glass-card p-5 cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#10b981]/20 border border-[#00d4ff]/20 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-[#00d4ff]" /></div>
                    <div><h3 className="text-white font-semibold text-sm group-hover:text-[#00d4ff] transition-colors">{drug.drugName}</h3>
                      {drug.brandNames?.[0] && <p className="text-white/30 text-xs">{drug.brandNames[0]}</p>}</div>
                  </div>
                  <span className={`badge text-[10px] ${drug.riskScore >= 70 ? 'badge-danger' : drug.riskScore >= 40 ? 'badge-warning' : 'badge-success'}`}>{drug.riskScore}%</span>
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
        {results.length === 0 && !loading && <div className="text-center py-20"><Search className="w-12 h-12 text-white/10 mx-auto mb-4" /><p className="text-white/30 text-lg">No drugs found</p></div>}
      </div>
      <AnimatePresence>
        {selectedDrug && (
          <DrugDetailPanel
            drug={selectedDrug}
            onClose={() => setSelectedDrug(null)}
            userAge={userProfile?.age || user?.age}
            userAllergies={userProfile?.allergies || user?.allergies}
          />
        )}
      </AnimatePresence>
      <Footer />
    </main>
  );
}
