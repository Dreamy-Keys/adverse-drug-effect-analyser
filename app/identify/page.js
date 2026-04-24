'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ScanLine, Search, Pill, Loader2 } from 'lucide-react';

const COLORS = ['White','Yellow','Orange','Red','Pink','Purple','Blue','Green','Brown','Black','Gray','Tan'];
const SHAPES = ['Round','Oval','Capsule','Oblong','Square','Rectangle','Diamond','Triangle','Pentagon','Hexagon'];

export default function IdentifyPage() {
  const [color, setColor] = useState('');
  const [shape, setShape] = useState('');
  const [imprint, setImprint] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true); setSearched(true);
    try {
      const q = [imprint, color, shape].filter(Boolean).join(' ');
      const res = await fetch(`/api/drugs/search?q=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {} finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <div className="pt-[100px] pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="text-center mb-12">
          <h1 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-4">Pill <span className="gradient-text-static">Identifier</span></h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Identify unknown pills by color, shape, and imprint markings</p>
        </motion.div>

        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }} className="glass-card p-6 md:p-8 max-w-2xl mx-auto mb-10">
          <div className="space-y-6">
            {/* Color Selection */}
            <div>
              <label className="text-white/60 text-sm font-medium mb-3 block">Pill Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(color === c ? '' : c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${color === c ? 'bg-[#00d4ff]/20 border-[#00d4ff]/50 text-[#00d4ff]' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.06]'} border`}>
                    {c}
                  </button>))}
              </div>
            </div>

            {/* Shape Selection */}
            <div>
              <label className="text-white/60 text-sm font-medium mb-3 block">Pill Shape</label>
              <div className="flex flex-wrap gap-2">
                {SHAPES.map(s => (
                  <button key={s} onClick={() => setShape(shape === s ? '' : s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${shape === s ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.06]'} border`}>
                    {s}
                  </button>))}
              </div>
            </div>

            {/* Imprint Input */}
            <div>
              <label className="text-white/60 text-sm font-medium mb-2 block">Imprint Text</label>
              <input type="text" value={imprint} onChange={e => setImprint(e.target.value)}
                placeholder="Enter text printed on the pill..." className="input-glass" />
            </div>

            <button onClick={handleSearch} disabled={loading || (!color && !shape && !imprint)}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Searching...' : 'Identify Pill'}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        {searched && (
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
            {results.length > 0 ? (
              <div>
                <h2 className="text-white font-semibold mb-4">Possible Matches ({results.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((drug, i) => (
                    <motion.div key={drug.id} initial={{ opacity:0,y:15 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.05 }}>
                      <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4]/20 to-[#0891b2]/20 border border-[#06b6d4]/20 flex items-center justify-center">
                            <Pill className="w-5 h-5 text-[#06b6d4]" /></div>
                          <div><h3 className="text-white font-semibold text-sm">{drug.drugName}</h3>
                            {drug.brandNames?.[0] && <p className="text-white/30 text-xs">{drug.brandNames[0]}</p>}</div>
                        </div>
                        {drug.dosageForms?.[0] && <p className="text-white/40 text-xs mb-1">Form: {drug.dosageForms[0]}</p>}
                        {drug.routes?.[0] && <p className="text-white/40 text-xs">Route: {drug.routes.join(', ')}</p>}
                      </div>
                    </motion.div>))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <ScanLine className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/30 text-lg mb-2">No matches found</p>
                <p className="text-white/20 text-sm">Try different criteria or consult a pharmacist for identification</p>
              </div>)}
          </motion.div>)}
      </div>
      <Footer />
    </main>
  );
}
