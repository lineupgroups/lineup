import React from 'react';
import { Rocket, ArrowRight, Sparkles, TrendingUp, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function HeroCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartProject = () => {
    if (user) {
      navigate('/dashboard/projects/create');
    } else {
      navigate('/?action=signup');
    }
  };

  const handleDiscover = () => {
    navigate('/discover');
  };

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-brand-black pt-20">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-acid/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]"></div>
        
        {/* Abstract Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center">
        {/* Premium Badge */}
        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 mb-12 animate-fade-in group cursor-default hover:bg-white/10 transition-all">
          <div className="w-2 h-2 bg-brand-acid rounded-full animate-ping"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-brand-white transition-colors">
            Broadcast Mode <span className="text-brand-acid">Active</span>
          </span>
          <Sparkles className="w-3 h-3 text-brand-acid opacity-50" />
        </div>

        {/* Massive Editorial Heading */}
        <div className="mb-10 space-y-2">
          <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black text-brand-white leading-[0.85] italic uppercase tracking-tighter filter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            FOR THE
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-acid via-white to-brand-orange animate-gradient-x">
              IDEA NATION
            </span>
          </h1>
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="h-[2px] w-12 bg-brand-acid/50"></div>
            <span className="text-xs font-black uppercase tracking-[0.5em] text-neutral-500">Edition 2026</span>
            <div className="h-[2px] w-12 bg-brand-orange/50"></div>
          </div>
        </div>

        {/* Minimalist Subheading */}
        <p className="text-xl md:text-2xl text-neutral-400 mb-16 max-w-2xl mx-auto leading-relaxed font-medium tracking-tight">
          The ultimate platform for modern visionaries. Deploy your concepts. 
          <br className="hidden md:block" />
          Acquire capital. Join the elite interaction.
        </p>

        {/* Oscar-Winning CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24">
          <button
            onClick={handleStartProject}
            className="group relative px-12 py-6 bg-brand-acid text-brand-black font-black italic uppercase tracking-[0.15em] text-sm rounded-[2rem] hover:bg-brand-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(204,255,0,0.3)] flex items-center gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            <Rocket className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            <span>Deploy Project</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>

          <button
            onClick={handleDiscover}
            className="group px-12 py-6 bg-white/5 backdrop-blur-xl text-brand-white font-black italic uppercase tracking-[0.15em] text-sm rounded-[2rem] hover:bg-white/10 transition-all border border-white/10 flex items-center gap-4 hover:border-brand-acid/50 active:scale-95"
          >
            <TrendingUp className="w-5 h-5 text-brand-acid" />
            <span>Analyze Market</span>
            <div className="w-8 h-8 bg-brand-acid/10 rounded-full flex items-center justify-center group-hover:bg-brand-acid group-hover:text-brand-black transition-all">
              <Play className="w-3 h-3 fill-current" />
            </div>
          </button>
        </div>

        {/* Elite Interaction Stats (Social Proof) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 max-w-4xl mx-auto border-t border-white/5 pt-16">
          <div className="text-left group">
            <div className="text-4xl font-black text-brand-white italic uppercase tracking-tighter mb-1 group-hover:text-brand-acid transition-colors">1K+</div>
            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Verified Deployments</div>
          </div>
          <div className="text-left group">
            <div className="text-4xl font-black text-brand-white italic uppercase tracking-tighter mb-1 group-hover:text-brand-orange transition-colors">₹10Cr+</div>
            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Total Capital Flow</div>
          </div>
          <div className="hidden md:block text-left group">
            <div className="text-4xl font-black text-brand-white italic uppercase tracking-tighter mb-1 group-hover:text-brand-acid transition-colors">95%</div>
            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Success Velocity</div>
          </div>
        </div>
      </div>

      {/* Premium Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-black to-transparent z-20"></div>
    </section>
  );
}

