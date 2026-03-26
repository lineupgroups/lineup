import React from 'react';
import { Shield, Lock, CheckCircle, Award, Users, TrendingUp } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Secure Payments',
      description: '256-bit SSL encryption',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: CheckCircle,
      title: 'Verified Projects',
      description: 'Manual review process',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Lock,
      title: 'Data Protected',
      description: 'GDPR compliant',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Award,
      title: 'Trusted Platform',
      description: '10,000+ successful projects',
      color: 'from-orange-400 to-red-500'
    },
    {
      icon: Users,
      title: 'Active Community',
      description: '50,000+ users',
      color: 'from-indigo-400 to-purple-500'
    },
    {
      icon: TrendingUp,
      title: '95% Success Rate',
      description: 'Industry leading',
      color: 'from-teal-400 to-cyan-500'
    }
  ];

  return (
    <section className="py-12 bg-white border-t border-b border-gray-100">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Why Trust Lineup?
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            Safe, Secure, and Trusted by Thousands
          </h3>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 transition-all cursor-default"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <div className="font-semibold text-gray-900 text-sm mb-1">
                  {badge.title}
                </div>

                {/* Description */}
                <div className="text-xs text-gray-600">
                  {badge.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Trust Indicators */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>PCI DSS Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Verified by Google</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🇮🇳</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>
    </section>
  );
}

