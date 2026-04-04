import React from 'react';

const Footer: React.FC = () => {
  const columns = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Beta', href: '#beta' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Press', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy', href: '#' },
        { name: 'Terms', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-white dark:bg-[#0A0E1A] pt-24 pb-12 border-t border-slate-200 dark:border-white/5 transition-colors">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-blue rounded-sm flex items-center justify-center text-white font-bold text-xl">M</div>
              <span className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Montridge</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              The world's first real-time AI news intelligence platform. Built to find what matters.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-bold text-slate-900 dark:text-white mb-6 uppercase text-sm tracking-widest">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-slate-500 dark:text-slate-400 hover:text-brand-blue transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2026 Montridge. Built to find what matters.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-brand-blue transition-colors">Twitter</a>
            <a href="#" className="text-slate-400 hover:text-brand-blue transition-colors">LinkedIn</a>
            <a href="#" className="text-slate-400 hover:text-brand-blue transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
