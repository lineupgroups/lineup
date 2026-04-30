import React from 'react';
import { Shield, Lock, CheckCircle, Award, Users, TrendingUp } from 'lucide-react';

export default function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Protocol Secure',
      description: '256-BIT QUANTUM ENCRYPTION',
      color: 'text-brand-acid'
    },
    {
      icon: CheckCircle,
      title: 'Intel Verified',
      description: 'ELITE MANUAL CLEARANCE',
      color: 'text-brand-orange'
    },
    {
      icon: Lock,
      title: 'Vault Protected',
      description: 'GDPR SOVEREIGN COMPLIANT',
      color: 'text-brand-acid'
    },
    {
      icon: Award,
      title: 'Elite Status',
      description: '10K+ GLOBAL DEPLOYMENTS',
      color: 'text-brand-orange'
    },
    {
      icon: Users,
      title: 'Network Active',
      description: '50K+ VERIFIED ENTITIES',
      color: 'text-brand-acid'
    },
    {
      icon: TrendingUp,
      title: 'Max Velocity',
      description: '95% SUCCESS MAGNITUDE',
      color: 'text-brand-orange'
    }
  ];

  return (
    <section className="py-20 bg-brand-black border-y border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[10px] font-black text-brand-acid uppercase tracking-[0.4em] mb-4">
            Security Infrastructure
          </p>
          <h3 className="text-4xl font-black text-brand-white italic uppercase tracking-tighter">
            TRUSTED BY THE <span className="text-brand-orange">IDEA NATION</span>
          </h3>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-brand-acid/30 hover:bg-white/10 transition-all cursor-default relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-brand-acid/10 transition-all"></div>
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-brand-black border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl relative z-10`}>
                  <Icon className={`w-5 h-5 ${badge.color}`} />
                </div>

                {/* Title */}
                <div className="font-black text-brand-white text-[10px] italic uppercase tracking-widest mb-2 relative z-10">
                  {badge.title}
                </div>

                {/* Description */}
                <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest leading-tight relative z-10">
                  {badge.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Trust Indicators */}
        <div className="mt-20 flex flex-wrap justify-center items-center gap-12 text-neutral-600 text-[9px] font-black uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3 group cursor-default">
            <Shield className="w-4 h-4 group-hover:text-brand-acid transition-colors" />
            <span className="group-hover:text-brand-white transition-colors">PCI DSS COMPLIANT</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <Lock className="w-4 h-4 group-hover:text-brand-orange transition-colors" />
            <span className="group-hover:text-brand-white transition-colors">ISO 27001 CERTIFIED</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <CheckCircle className="w-4 h-4 group-hover:text-brand-acid transition-colors" />
            <span className="group-hover:text-brand-white transition-colors">VERIFIED BY GOOGLE</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <span className="text-sm">🇮🇳</span>
            <span className="group-hover:text-brand-white transition-colors">BORN IN INDIA</span>
          </div>
        </div>
      </div>
    </section>
  );
}

