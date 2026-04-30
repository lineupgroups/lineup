import React from 'react';
import { Twitter, Instagram, Mail, Phone, MapPin, ArrowUpRight, Github, Linkedin } from 'lucide-react';
import { LogoDark } from './common/Logo';

export default function Footer() {
  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { label: 'Discover', href: '/trending' },
        { label: 'How It Works', href: '#' },
        { label: 'Success Stories', href: '#' },
        { label: 'Projects', href: '/trending' }
      ]
    },
    {
      title: 'Creators',
      links: [
        { label: 'Start a Project', href: '/dashboard/projects/create' },
        { label: 'Creator Handbook', href: '#' },
        { label: 'Resources', href: '#' },
        { label: 'Funding Guide', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Brand Assets', href: '#' },
        { label: 'Contact', href: '#' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', href: '#' },
        { label: 'Privacy', href: '#' },
        { label: 'Cookies', href: '#' },
        { label: 'Guidelines', href: '#' }
      ]
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: 'https://www.instagram.com/lineup.groups/', label: 'Instagram' },
    { icon: Github, href: '#', label: 'Github' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer className="bg-[#0A0A0A] text-white pt-24 pb-12 overflow-hidden border-t border-white/5">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Top Section: Hero Branding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <div className="max-w-2xl">
            <div className="mb-8">
              <LogoDark size="xl" tagline="For the Idea Nation™" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-8">
              BUILDING THE <span className="text-brand-acid italic">FUTURE</span> <br /> 
              OF INDIA'S <span className="text-brand-orange">CREATIVE</span> ECONOMY.
            </h2>
            <p className="text-neutral-500 text-lg md:text-xl max-w-md leading-relaxed">
              Lineup is the premier launchpad for India's next generation of innovators, creators, and builders.
            </p>
          </div>
          
          <div className="flex flex-col justify-end lg:items-end">
            <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 w-full max-w-md hover:border-brand-acid/30 transition-all duration-500 group">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                Join the Circle
                <span className="w-2 h-2 bg-brand-acid rounded-full animate-pulse" />
              </h3>
              <p className="text-neutral-500 mb-6 text-sm">Get exclusive updates on the most promising projects.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="flex-1 bg-brand-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-acid transition-colors"
                />
                <button className="bg-brand-acid text-brand-black p-3 rounded-xl hover:scale-105 transition-transform active:scale-95">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24 pt-16 border-t border-white/5">
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                {column.title}
              </h4>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="text-neutral-400 hover:text-brand-acid transition-all duration-300 text-base flex items-center group gap-1"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section: Socials & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-white/5">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-6">
              {socialLinks.map((social) => (
                <a 
                  key={social.label} 
                  href={social.href} 
                  className="text-neutral-500 hover:text-white transition-all duration-300 hover:-translate-y-1"
                  aria-label={social.label}
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
            <p className="text-neutral-600 text-xs font-medium">
              © 2024 LINEUP. ALL RIGHTS RESERVED. FOR THE IDEA NATION™.
            </p>
          </div>

          <div className="flex items-center gap-8 text-neutral-600 text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <span className="w-2 h-2 bg-brand-orange rounded-full" />
              MADE IN INDIA
            </div>
            <a href="#" className="hover:text-white transition-colors">STATUS</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
        </div>

      </div>
    </footer>
  );
}