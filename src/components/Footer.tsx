import React from 'react';
import { Twitter, Instagram, Mail, Phone, MapPin, ShieldCheck, Lock, RefreshCcw } from 'lucide-react';

export default function Footer() {
  const quickLinks = [
    { label: 'About Us', href: '#' },
    { label: 'How It Works', href: '#' },
    { label: 'Success Stories', href: '#' },
    { label: 'Blog', href: '#' }
  ];

  const supportLinks = [
    { label: 'Help Center', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Contact Support', href: '#' }
  ];

  const creatorLinks = [
    { label: 'Start a Project', href: '#' },
    { label: 'Creator Handbook', href: '#' },
    { label: 'Creator Resources', href: '#' },
    { label: 'Success Tips', href: '#' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Lineup</h3>
                <p className="text-sm text-orange-400 font-medium">For the Idea Nation™</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering India's youth to transform innovative ideas into reality.
              Join thousands of creators and supporters building the future together.
            </p>

            {/* Social Media */}
            <div className="flex space-x-4 mb-6">
              <a href="#" className="p-2 bg-gray-800 hover:bg-orange-500 rounded-lg transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/lineup.groups/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-orange-500 rounded-lg transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>lineup.groups@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Chennai, Tamil Nadu, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Discover</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Creator Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">For Creators</h4>
            <ul className="space-y-2">
              {creatorLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Trust & Safety</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-sm text-gray-300">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span>Verified Creators</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-300">
                <Lock className="w-5 h-5 text-blue-500" />
                <span>Secure Payments</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-300">
                <RefreshCcw className="w-5 h-5 text-orange-500" />
                <span>Money Back Guarantee</span>
              </li>
            </ul>
          </div>
        </div>


        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-400">
            <div className="mb-2 md:mb-0">
              <span>© 2024 Lineup - For the Idea Nation™. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="hover:text-orange-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Cookies</a>
              <div className="flex items-center space-x-2">
                <span>🇮🇳</span>
                <span>Made in India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}