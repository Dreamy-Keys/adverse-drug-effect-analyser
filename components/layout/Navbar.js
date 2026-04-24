'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import useAuthStore from '../../lib/store/authStore';
import { Menu, X, Shield, LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, init } = useAuthStore();

  useEffect(() => {
    init();
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [init]);

  const navLinks = [
    { href: '/search', label: 'Drug Search' },
    { href: '/interactions', label: 'Interactions' },
    { href: '/tracker', label: 'Tracker' },
    { href: '/alerts', label: 'Alerts' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0e14]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#10b981] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all">
                <Shield className="w-5 h-5 text-[#0a0e14]" strokeWidth={2.5} />
              </div>
              <span className="font-['Poppins'] font-bold text-lg tracking-tight">
                <span className="text-white">Med</span>
                <span className="text-[#00d4ff]">Guard</span>
                <span className="text-[#10b981] text-sm ml-1 font-medium">AI</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-[14px] text-white/70 hover:text-white font-medium rounded-lg hover:bg-white/[0.05] transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-[14px] text-white/80 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#10b981] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#0a0e14]" />
                    </div>
                    <span className="text-sm text-white/80 font-medium">{user.name?.split(' ')[0]}</span>
                  </div>
                  <button onClick={logout} className="p-2 text-white/40 hover:text-red-400 transition-colors rounded-lg hover:bg-white/[0.05]">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="px-5 py-2 text-[14px] text-white/80 hover:text-white font-medium rounded-lg hover:bg-white/[0.05] transition-all">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary text-sm !py-2.5 !px-5 rounded-xl">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#0a0e14]/98 backdrop-blur-xl pt-[80px] px-6 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-lg text-white/80 hover:text-white font-medium rounded-xl hover:bg-white/[0.05] transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-4" />
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-lg text-white/80 font-medium rounded-xl hover:bg-white/[0.05]">
                    Dashboard
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="px-4 py-3 text-lg text-red-400 font-medium text-left rounded-xl hover:bg-white/[0.05]">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-lg text-white/80 font-medium rounded-xl hover:bg-white/[0.05]">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center mt-2 text-lg">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
