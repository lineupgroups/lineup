import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Rocket, Heart, Activity, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ComparisonTable() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      category: 'AUTHENTICATION & ACCESS',
      items: [
        { feature: 'NODE INITIALIZATION', creator: true, supporter: true, creatorDetail: 'ZERO CAPITAL', supporterDetail: 'ZERO CAPITAL' },
        { feature: 'PROFILE CALIBRATION', creator: true, supporter: true, creatorDetail: 'FULL EDITORIAL', supporterDetail: 'BASIC INTEL' },
        { feature: 'IDENTITY PROTOCOL (KYC)', creator: true, supporter: false, creatorDetail: 'MANDATORY', supporterDetail: 'OPTIONAL' }
      ]
    },
    {
      category: 'CAPABILITY MATRIX',
      items: [
        { feature: 'PROJECT DEPLOYMENT', creator: true, supporter: false, creatorDetail: 'UNLIMITED', supporterDetail: 'READ-ONLY' },
        { feature: 'GLOBAL SURVEILLANCE', creator: true, supporter: true, creatorDetail: 'ELITE ACCESS', supporterDetail: 'ELITE ACCESS' },
        { feature: 'CAPITAL ENGAGEMENT', creator: true, supporter: true, creatorDetail: 'NETWORK SUPPORT', supporterDetail: 'PRIMARY ENGAGEMENT' },
        { feature: 'INTEL ANALYTICS', creator: true, supporter: false, creatorDetail: 'REAL-TIME telemetry', supporterDetail: 'BASIC LOGS' }
      ]
    },
    {
      category: 'INTEL CHANNELS',
      items: [
        { feature: 'UPDATE BROADCAST', creator: true, supporter: false, creatorDetail: 'GLOBAL FEEDS', supporterDetail: '-' },
        { feature: 'FEED MONITORING', creator: true, supporter: true, creatorDetail: 'SYSTEM-WIDE', supporterDetail: 'FOLLOWED NODES' },
        { feature: 'ENCRYPTED MESSAGING', creator: true, supporter: true, creatorDetail: 'DIRECT CHANNELS', supporterDetail: 'DIRECT CHANNELS' }
      ]
    },
    {
      category: 'FINANCIAL SETTLEMENTS',
      items: [
        { feature: 'PLATFORM PROTOCOL FEE', creator: true, supporter: false, creatorDetail: '5% ON SUCCESS', supporterDetail: 'ZERO' },
        { feature: 'GATEWAY OPTIONS', creator: true, supporter: true, creatorDetail: 'UPI / BANK', supporterDetail: 'UPI / CARDS' },
        { feature: 'RAPID SETTLEMENT', creator: true, supporter: false, creatorDetail: 'POST-MILESTONE', supporterDetail: '-' }
      ]
    }
  ];

  const visibleCategories = isExpanded ? features : features.slice(0, 2);

  return (
    <section className="py-32 bg-brand-black border-b border-white/5 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[20%] w-[30%] h-[30%] bg-brand-acid/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
            <Shield className="w-4 h-4 text-brand-orange" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
              CAPABILITY <span className="text-brand-orange">AUDIT</span>
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-brand-white italic uppercase tracking-tighter mb-8 leading-none">
            CHOOSE YOUR <span className="text-brand-acid">PROTOCOL</span>
          </h2>
          <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-medium tracking-tight">
            Defining the operational parameters for creators and supporters within the Idea Nation.
          </p>
        </div>

        {/* Comparison Table Container */}
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-6 sm:p-12 border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-acid/5 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-8 mb-16 border-b border-white/5 pb-12">
            <div className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.5em] flex items-center">
              SYSTEM PARAMETERS
            </div>
            <div className="text-center group">
              <div className="inline-flex flex-col items-center bg-white/5 border border-white/10 rounded-[2rem] p-8 w-full group-hover:bg-brand-acid group-hover:text-brand-black transition-all duration-500">
                <Heart className="w-8 h-8 mb-4 text-brand-orange group-hover:text-brand-black transition-colors" />
                <div className="font-black text-xl italic uppercase tracking-tighter">Supporter</div>
                <div className="text-[9px] font-bold uppercase tracking-widest mt-2 opacity-50 group-hover:opacity-80">PROTOCOL S_1</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="inline-flex flex-col items-center bg-white/5 border border-white/10 rounded-[2rem] p-8 w-full group-hover:bg-brand-orange group-hover:text-brand-black transition-all duration-500">
                <Rocket className="w-8 h-8 mb-4 text-brand-acid group-hover:text-brand-black transition-colors" />
                <div className="font-black text-xl italic uppercase tracking-tighter">Creator</div>
                <div className="text-[9px] font-bold uppercase tracking-widest mt-2 opacity-50 group-hover:opacity-80">PROTOCOL C_1</div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-16">
            {visibleCategories.map((category, catIndex) => (
              <div key={catIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${catIndex * 100}ms` }}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5"></div>
                  <h3 className="text-[10px] font-black text-brand-acid uppercase tracking-[0.4em] italic">{category.category}</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5"></div>
                </div>

                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="grid grid-cols-3 gap-8 items-center bg-white/[0.02] hover:bg-white/[0.05] rounded-[1.5rem] p-6 transition-all border border-transparent hover:border-white/5 group"
                    >
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest group-hover:text-brand-white transition-colors">
                        {item.feature}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        {item.supporter ? (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center mb-2">
                              <Check className="w-4 h-4 text-brand-orange" />
                            </div>
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{item.supporterDetail}</span>
                          </div>
                        ) : (
                          <X className="w-4 h-4 text-neutral-800" />
                        )}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        {item.creator ? (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-acid/20 flex items-center justify-center mb-2">
                              <Check className="w-4 h-4 text-brand-acid" />
                            </div>
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{item.creatorDetail}</span>
                          </div>
                        ) : (
                          <X className="w-4 h-4 text-neutral-800" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Precision Toggle */}
          <div className="text-center mt-16 pt-12 border-t border-white/5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="group inline-flex items-center gap-4 px-10 py-4 bg-white/5 hover:bg-white/10 text-brand-white rounded-[2rem] border border-white/10 transition-all active:scale-95 shadow-2xl"
            >
              <span className="text-[10px] font-black italic uppercase tracking-[0.3em]">
                {isExpanded ? 'Compress Analytics' : 'Expand Full Matrix'}
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-acid" /> : <ChevronDown className="w-4 h-4 text-brand-orange" />}
            </button>
          </div>
        </div>

        {/* Global Action Callouts */}
        <div className="mt-20 grid md:grid-cols-2 gap-8">
          <div className="relative group bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl group-hover:bg-brand-orange/10 transition-all"></div>
            <Heart className="w-12 h-12 mb-8 text-brand-orange group-hover:scale-110 transition-transform" />
            <h3 className="text-3xl font-black text-brand-white italic uppercase tracking-tighter mb-4 leading-none">SUPPORTER PROTOCOL</h3>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-10 leading-relaxed max-w-xs">
              INITIALIZE YOUR ROLE AS A BENEFACTOR. SURVEIL AND SUPPORT THE NATION'S ELITE DEPLOYMENTS.
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="w-full bg-brand-orange text-brand-black font-black italic uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl shadow-2xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all"
            >
              Initialize Engagement
            </button>
          </div>

          <div className="relative group bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl group-hover:bg-brand-acid/10 transition-all"></div>
            <Rocket className="w-12 h-12 mb-8 text-brand-acid group-hover:scale-110 transition-transform" />
            <h3 className="text-3xl font-black text-brand-white italic uppercase tracking-tighter mb-4 leading-none">CREATOR PROTOCOL</h3>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-10 leading-relaxed max-w-xs">
              INITIALIZE YOUR ROLE AS AN ORIGINATOR. DEPLOY CONCEPTS AND ACQUIRE GLOBAL CAPITAL.
            </p>
            <button
              onClick={() => navigate('/dashboard/projects/create')}
              className="w-full bg-brand-acid text-brand-black font-black italic uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl shadow-2xl shadow-brand-acid/20 hover:scale-105 active:scale-95 transition-all"
            >
              Initialize Deployment
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
