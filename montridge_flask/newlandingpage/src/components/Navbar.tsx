import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Process', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Beta', href: '#beta' },
  ];

  const scrollToBeta = () => {
    document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled 
          ? 'bg-white/70 dark:bg-[#0A0E1A]/70 backdrop-blur-md border-b border-slate-200 dark:border-white/10 py-3' 
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 flex-shrink-0 text-slate-900 dark:text-white">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M 15 65 V 15 L 40 40 L 65 15 V 65" fill="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
            Montridge
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-blue transition-all hover:tracking-wider"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <a href="/login" className="hidden md:block text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-blue transition-colors">
            Login
          </a>

          <a
            href="/login"
            className="px-6 py-2.5 bg-brand-blue hover:bg-blue-600 text-white rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            Sign Up
          </a>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#0A0E1A] border-b border-slate-200 dark:border-white/10 shadow-2xl"
          >
            <div className="flex flex-col gap-6 p-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl font-display font-bold text-slate-900 dark:text-white hover:text-brand-blue transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="h-[1px] bg-slate-100 dark:bg-white/10 my-2" />
              <a href="/login" className="w-full py-4 text-lg font-bold text-slate-600 dark:text-slate-300 text-center block">
                Login
              </a>
              <a
                href="/login"
                className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 text-center block"
              >
                Sign Up
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
