'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import {
  Search, ShieldCheck, Pill, Activity, Bell,
  ArrowRight, Zap, Database, Brain, ChevronRight,
  Heart, TrendingUp, AlertTriangle, Users
} from 'lucide-react';

function ScrollReveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ end, label, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold font-['Poppins'] gradient-text-static">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-white/50 text-sm mt-2 font-medium">{label}</div>
    </div>
  );
}

const features = [
  {
    icon: Search,
    title: 'Drug Search Engine',
    desc: 'Search across 3,800+ drugs with instant autocomplete. Find brand names, generic names, and drug classes.',
    href: '/search',
    gradient: 'from-[#00d4ff] to-[#0ea5e9]',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    icon: ShieldCheck,
    title: 'Interaction Checker',
    desc: 'Check up to 30 drugs for potential interactions based on real adverse event data.',
    href: '/interactions',
    gradient: 'from-[#10b981] to-[#059669]',
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    icon: Activity,
    title: 'Side Effect Analysis',
    desc: 'View frequency-ranked side effects with severity scoring from FDA reports.',
    href: '/search',
    gradient: 'from-[#f59e0b] to-[#d97706]',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    icon: Pill,
    title: 'Medication Tracker',
    desc: 'Track your medications, set schedules, and monitor adherence with visual analytics.',
    href: '/tracker',
    gradient: 'from-[#8b5cf6] to-[#7c3aed]',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Get notified about drug recalls, interaction warnings, and high-risk medications.',
    href: '/alerts',
    gradient: 'from-[#ef4444] to-[#dc2626]',
    span: 'md:col-span-1 md:row-span-1',
  },
];

const steps = [
  { icon: Database, title: 'FDA Data Ingested', desc: '2,287 adverse event reports processed from the FDA FAERS database' },
  { icon: Brain, title: 'AI Analysis', desc: 'Drug interactions detected through co-occurrence analysis and severity scoring' },
  { icon: Zap, title: 'Instant Insights', desc: 'Get drug safety information, interaction warnings, and side effect profiles instantly' },
];

export default function Home() {
  const [stats, setStats] = useState({ totalDrugs: 0, totalInteractions: 0, totalEvents: 0 });

  useEffect(() => {
    fetch('/api/drugs/search?stats=true')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0e14] overflow-hidden">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center pt-[72px]">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#00d4ff]/[0.04] rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[#10b981]/[0.04] rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00d4ff]/[0.02] rounded-full blur-[150px]" />

          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-8">
              <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-xs font-medium text-white/60 tracking-wider uppercase">Powered by FDA Adverse Event Data</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="font-['Poppins'] font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-6">
              <span className="text-white">Drug Safety</span>
              <br />
              <span className="gradient-text">Intelligence</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Analyze drug interactions, track medications, and access real adverse event data —
              all powered by{' '}
              <span className="text-[#00d4ff]/80 font-medium">3,847 drugs</span> and{' '}
              <span className="text-[#10b981]/80 font-medium">17,107 interaction pairs</span>.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/search" className="btn-primary flex items-center gap-2 text-base !px-8 !py-3.5 group">
                <Search className="w-5 h-5" />
                Search Drugs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/interactions" className="btn-secondary flex items-center gap-2 text-base !px-8 !py-3.5">
                <ShieldCheck className="w-5 h-5" />
                Check Interactions
              </Link>
            </div>
          </ScrollReveal>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="relative py-20 border-y border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00d4ff]/[0.02] to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedCounter end={stats.totalDrugs || 3847} label="Drugs Indexed" />
              <AnimatedCounter end={stats.totalInteractions || 17107} label="Interactions Mapped" />
              <AnimatedCounter end={stats.totalEvents || 2287} label="FDA Reports Analyzed" />
              <AnimatedCounter end={99} suffix="%" label="Data Coverage" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========== FEATURES BENTO GRID ========== */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-[#00d4ff] text-sm font-semibold tracking-widest uppercase mb-3 block">Features</span>
              <h2 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-4">
                Everything You Need for
                <br />
                <span className="gradient-text-static">Drug Safety</span>
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                Comprehensive tools backed by real FDA adverse event data
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <ScrollReveal key={i} delay={i * 0.08} className={feature.span}>
                <Link href={feature.href} className="block h-full">
                  <div className="glass-card p-6 md:p-8 h-full group cursor-pointer relative overflow-hidden">
                    {/* Hover glow */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.08] blur-3xl transition-opacity duration-500 rounded-full`} />

                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-[#00d4ff] transition-colors">{feature.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-white/30 group-hover:text-[#00d4ff] text-sm transition-colors">
                      Explore <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative py-24 border-y border-white/[0.06]">
        <div className="absolute inset-0 bg-mesh" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-[#10b981] text-sm font-semibold tracking-widest uppercase mb-3 block">How It Works</span>
              <h2 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white">
                From Raw Data to{' '}
                <span className="gradient-text-static">Actionable Insights</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <div className="glass-card p-8 text-center relative">
                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-5xl font-black font-['Poppins'] text-white/[0.04]">
                    0{i + 1}
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#10b981]/20 border border-[#00d4ff]/20 flex items-center justify-center mx-auto mb-5">
                    <step.icon className="w-7 h-7 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TRUST INDICATORS ========== */}
      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="glass-card p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00d4ff]/10 to-[#10b981]/10 blur-[100px] rounded-full" />
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="font-['Poppins'] font-bold text-2xl md:text-4xl text-white mb-4">
                    Trusted Data From
                    <br />
                    <span className="text-[#00d4ff]">FDA FAERS</span>
                  </h2>
                  <p className="text-white/40 leading-relaxed mb-6">
                    Our drug intelligence is derived directly from the FDA Adverse Event Reporting System (FAERS),
                    ensuring every interaction warning and side effect profile is backed by real-world clinical data.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['Real Clinical Data', 'Evidence-Based', 'Updated Regularly'].map(tag => (
                      <span key={tag} className="badge badge-info">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Heart, label: 'Patient Safety', value: 'Priority #1' },
                    { icon: TrendingUp, label: 'Data Points', value: '156MB+' },
                    { icon: AlertTriangle, label: 'Risk Alerts', value: 'Real-time' },
                    { icon: Users, label: 'Open Access', value: 'Free' },
                  ].map((item, i) => (
                    <div key={i} className="glass-card-static p-4 text-center">
                      <item.icon className="w-5 h-5 text-[#00d4ff] mx-auto mb-2" />
                      <div className="text-white font-semibold text-sm">{item.value}</div>
                      <div className="text-white/30 text-xs mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00d4ff]/[0.03] to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <h2 className="font-['Poppins'] font-bold text-3xl md:text-5xl text-white mb-6">
              Start Analyzing{' '}
              <span className="gradient-text-static">Drug Safety</span>{' '}
              Today
            </h2>
            <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto">
              Access comprehensive drug data, check interactions, and track your medications — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary flex items-center gap-2 text-base !px-10 !py-4 group">
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/search" className="btn-secondary text-base !px-10 !py-4">
                Try Drug Search
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
