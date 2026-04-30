import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Users, TrendingUp, Activity } from 'lucide-react';
import { useHighlyFundedProjects } from '../../hooks/useHighlyFundedProjects';
import LoadingSpinner from '../common/LoadingSpinner';

export default function HighlyFundedSection() {
  const { projects: fundedProjects, loading, error } = useHighlyFundedProjects();

  if (loading) {
    return (
      <section className="py-24 bg-brand-black">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 h-96 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !fundedProjects.length) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  return (
    <section className="py-32 bg-brand-black border-b border-white/5 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-brand-acid/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
              <Target className="w-4 h-4 text-brand-acid" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
                Peak <span className="text-brand-acid">Performance</span>
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-brand-white italic uppercase tracking-tighter leading-none mb-6">
              HIGHLY <span className="text-brand-orange">FUNDED</span>
            </h2>
            <p className="text-lg text-neutral-500 font-medium tracking-tight">
              Observing the highest capital acquisition nodes within the Idea Nation.
            </p>
          </div>
          
          <Link
            to="/browse?sort=funded"
            className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-acid hover:text-brand-white transition-colors"
          >
            <span>Audit Full Registry</span>
            <div className="w-10 h-10 rounded-full bg-brand-acid/10 flex items-center justify-center group-hover:bg-brand-acid group-hover:text-brand-black transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Funded Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fundedProjects.slice(0, 3).map((project, index) => {
            const progress = getProgressPercentage(project.raised, project.goal || project.fundingGoal || 0);
            return (
              <div 
                key={project.id} 
                className="group relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 hover:border-brand-acid/30 transition-all duration-500 overflow-hidden flex flex-col h-full"
              >
                {/* Project Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent"></div>
                  
                  {/* Funded Badge */}
                  {progress >= 100 && (
                    <div className="absolute top-6 left-6 z-10">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-acid text-brand-black rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">
                        <Target className="w-3 h-3" />
                        <span>DEPLOYED & FUNDED</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black text-brand-white mb-3 italic uppercase tracking-tight group-hover:text-brand-acid transition-colors line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-500 mb-8 line-clamp-2 uppercase tracking-wider leading-relaxed">
                    {project.tagline}
                  </p>

                  {/* Progress Metrics */}
                  <div className="mt-auto space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">CAPITAL FLOW</div>
                        <div className="text-xl font-black text-brand-white italic uppercase tracking-tighter">
                          {formatCurrency(project.raised)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">MAGNITUDE</div>
                        <div className={`text-xl font-black italic uppercase tracking-tighter ${progress >= 100 ? 'text-brand-acid' : 'text-brand-orange'}`}>
                          {progress.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Precision Progress Bar */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.5)]' : 'bg-brand-orange shadow-[0_0_15px_rgba(255,91,0,0.5)]'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    {/* Meta Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 group/stat">
                        <Users className="w-4 h-4 text-neutral-600 group-hover/stat:text-brand-acid transition-colors" />
                        <span className="text-[9px] font-black text-neutral-600 group-hover/stat:text-brand-white transition-colors">{project.supporters} NODES</span>
                      </div>
                      <div className="flex items-center gap-2 group/stat">
                        <TrendingUp className="w-4 h-4 text-neutral-600 group-hover/stat:text-brand-orange transition-colors" />
                        <span className="text-[9px] font-black text-neutral-600 group-hover/stat:text-brand-white transition-colors">{progress >= 100 ? 'STABLE' : 'ACCELERATING'}</span>
                      </div>
                    </div>

                    {/* Engagement Call */}
                    <Link
                      to={`/project/${project.id}`}
                      className={`w-full flex items-center justify-center gap-4 py-4 rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] transition-all duration-500 border border-white/10 ${
                        progress >= 100 
                          ? 'bg-brand-acid/10 text-brand-acid hover:bg-brand-acid hover:text-brand-black hover:border-brand-acid' 
                          : 'bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-brand-black hover:border-brand-orange'
                      }`}
                    >
                      Audit Deployment
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
