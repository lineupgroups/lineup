import React, { useState } from 'react';
import { Lightbulb, FileText, Rocket, Heart, TrendingUp, Users, CheckCircle, ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type UserType = 'creator' | 'supporter';

export default function HowItWorksSection() {
  const [activeType, setActiveType] = useState<UserType>('supporter');
  const navigate = useNavigate();

  const creatorSteps = [
    {
      number: '01',
      icon: Lightbulb,
      title: 'Conceptualize',
      description: 'DEPLOY YOUR PROJECT INTEL WITH COMPELLING NARRATIVES AND FUNDING TARGETS.',
      accent: 'text-brand-acid',
      features: ['ZERO INITIAL CAPITAL', 'EDITORIAL WIZARD', '4K MEDIA DEPLOYMENT']
    },
    {
      number: '02',
      icon: FileText,
      title: 'Verification',
      description: 'ELITE MANUAL REVIEW WITHIN 24 HOURS TO GUARANTEE AUTHENTICITY AND QUALITY.',
      accent: 'text-brand-orange',
      features: ['FAST-TRACK CLEARANCE', 'EXPERT CALIBRATION', 'KYC PROTOCOL']
    },
    {
      number: '03',
      icon: Rocket,
      title: 'Deployment',
      description: 'GO LIVE ACROSS THE IDEA NATION. LEVERAGE TOOLS TO CAPTURE SUPPORTER INTERACTION.',
      accent: 'text-brand-acid',
      features: ['SOCIAL BROADCAST', 'DIRECT INTEL LOOPS', 'ANALYTICS ENGINE']
    },
    {
      number: '04',
      icon: TrendingUp,
      title: 'Acquisition',
      description: 'SECURE CAPITAL FROM THE ELITE NETWORK. WITHDRAW VIA INSTANT UPI SETTLEMENTS.',
      accent: 'text-brand-orange',
      features: ['REAL-TIME SETTLEMENT', 'DIRECT BANK LINK', 'PROGRESS TRACKING']
    }
  ];

  const supporterSteps = [
    {
      number: '01',
      icon: Users,
      title: 'Surveillance',
      description: 'ANALYZE INNOVATIVE DEPLOYMENTS ACROSS INDIA. FILTER BY INTEL PARAMETERS.',
      accent: 'text-brand-acid',
      features: ['VERIFIED CREATORS', 'LOCAL OPERATIONS', 'ELITE CATEGORIES']
    },
    {
      number: '02',
      icon: Heart,
      title: 'Engagement',
      description: 'SELECT TARGET PROJECTS AND COMMIT CAPITAL. EVERY RUPEE SCALES THE IMPACT.',
      accent: 'text-brand-orange',
      features: ['SECURE GATEWAYS', 'INFINITE SCALABILITY', 'TAX CERTIFICATIONS']
    },
    {
      number: '03',
      icon: CheckCircle,
      title: 'Monitoring',
      description: 'STAY SYNCHRONIZED WITH EXCLUSIVE INTEL, MILESTONES, AND BEHIND-THE-SCENES FEEDS.',
      accent: 'text-brand-acid',
      features: ['DIRECT FEEDS', 'PRIVATE CHANNELS', 'MILESTONE ALERTS']
    },
    {
      number: '04',
      icon: Zap,
      title: 'Impact',
      description: 'WITNESS THE REALIZATION OF CONCEPTS AND JOIN THE ELITE RANKS OF THE IDEA NATION.',
      accent: 'text-brand-orange',
      features: ['SUCCESS LOGS', 'CREATOR PROTOCOL', 'NETWORK BADGING']
    }
  ];

  const steps = activeType === 'creator' ? creatorSteps : supporterSteps;

  return (
    <section className="py-32 bg-brand-black relative overflow-hidden border-b border-white/5">
      {/* Background Cinematic Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(204,255,0,0.03)_0%,transparent_50%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(255,91,0,0.03)_0%,transparent_50%)]"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
            <Zap className="w-4 h-4 text-brand-orange" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
              OPERATIONAL <span className="text-brand-orange">PROTOCOLS</span>
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-brand-white italic uppercase tracking-tighter mb-8 leading-none">
            HOW THE <span className="text-brand-acid">NATION</span> DEPLOYS
          </h2>
          
          {/* Elite Toggle */}
          <div className="inline-flex bg-white/5 backdrop-blur-2xl rounded-[2rem] p-1.5 border border-white/10">
            <button
              onClick={() => setActiveType('supporter')}
              className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 ${
                activeType === 'supporter'
                  ? 'bg-brand-acid text-brand-black shadow-[0_0_30px_rgba(204,255,0,0.2)]'
                  : 'text-neutral-500 hover:text-brand-white'
              }`}
            >
              For Supporters
            </button>
            <button
              onClick={() => setActiveType('creator')}
              className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 ${
                activeType === 'creator'
                  ? 'bg-brand-orange text-brand-black shadow-[0_0_30px_rgba(255,91,0,0.2)]'
                  : 'text-neutral-500 hover:text-brand-white'
              }`}
            >
              For Creators
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Subtle Connection Path (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-1/2"></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Step Number Background */}
                <div className="absolute top-[-20px] right-[-20px] text-[8rem] font-black italic text-white/[0.03] leading-none group-hover:text-brand-acid/[0.05] transition-all">
                  {step.number}
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 rounded-2xl bg-brand-black border border-white/10 group-hover:border-${step.accent.split('-')[1]}/30 transition-all`}>
                    <Icon className={`w-6 h-6 ${step.accent}`} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Step {step.number}</div>
                    <h3 className="text-xl font-black text-brand-white italic uppercase tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] font-bold text-neutral-400 mb-8 leading-relaxed uppercase tracking-wider">
                  {step.description}
                </p>

                {/* Features List */}
                <div className="space-y-3 pt-6 border-t border-white/5">
                  {step.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-center gap-3">
                      <div className={`w-1 h-1 rounded-full ${step.accent.replace('text-', 'bg-')}`}></div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] group-hover:text-neutral-300 transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Callouts */}
        <div className="mt-24 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => navigate(activeType === 'supporter' ? '/discover' : '/dashboard/projects/create')}
              className={`px-12 py-5 rounded-[2rem] text-sm font-black italic uppercase tracking-[0.2em] transition-all transform hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-4 ${
                activeType === 'supporter'
                  ? 'bg-brand-acid text-brand-black shadow-brand-acid/20'
                  : 'bg-brand-orange text-brand-black shadow-brand-orange/20'
              }`}
            >
              {activeType === 'supporter' ? 'Initialize Discovery' : 'Deploy Manifesto'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/trending')}
              className="px-12 py-5 bg-white/5 backdrop-blur-2xl text-brand-white rounded-[2rem] font-black italic uppercase tracking-[0.2em] text-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              Surveillance Mode
              <Activity className="w-5 h-5 opacity-50" />
            </button>
          </div>
          
          <p className="mt-10 text-[9px] font-black text-neutral-600 uppercase tracking-[0.4em]">
            {activeType === 'supporter' 
              ? 'JOIN THE GLOBAL NETWORK OF ELITE BACKERS'
              : 'JOIN 1K+ VISIONARIES IN THE NEXT DEPLOYMENT CYCLE'
            }
          </p>
        </div>
      </div>
    </section>
  );
}
