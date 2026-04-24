'use client';
import Link from 'next/link';
import { Shield, Globe, MessageCircle, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#070a0f]">
      {/* Glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#10b981] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#0a0e14]" strokeWidth={2.5} />
              </div>
              <span className="font-['Poppins'] font-bold text-base">
                <span className="text-white">Med</span>
                <span className="text-[#00d4ff]">Guard</span>
                <span className="text-[#10b981] text-xs ml-0.5">AI</span>
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              AI-powered drug safety analysis backed by real FDA adverse event data.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white/80 font-semibold text-sm mb-4 tracking-wide uppercase">Features</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Drug Search', href: '/search' },
                { label: 'Interaction Checker', href: '/interactions' },
                { label: 'Medication Tracker', href: '/tracker' },
                { label: 'Alerts', href: '/alerts' },
              ].map(item => (
                <Link key={item.label} href={item.href}
                  className="text-white/40 text-sm hover:text-[#00d4ff] transition-colors">{item.label}</Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white/80 font-semibold text-sm mb-4 tracking-wide uppercase">Resources</h4>
            <div className="flex flex-col gap-2.5">
              {['API Documentation', 'OpenFDA Data', 'Safety Guidelines', 'Privacy Policy'].map(item => (
                <span key={item} className="text-white/40 text-sm cursor-default">{item}</span>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white/80 font-semibold text-sm mb-4 tracking-wide uppercase">Connect</h4>
            <div className="flex gap-3">
              {[Globe, MessageCircle, Mail].map((Icon, i) => (
                <div key={i} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 transition-all cursor-pointer">
                  <Icon className="w-4 h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.06] mt-12 mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © 2026 MedGuard AI. Data sourced from FDA Adverse Event Reporting System.
          </p>
          <p className="text-white/30 text-xs flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-400" /> for safer healthcare
          </p>
        </div>
      </div>
    </footer>
  );
}
